package com.fundsroom.bda;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public final class CustomerSalesJob {
    private static final int TOP_CUSTOMER_LIMIT = 10;

    private CustomerSalesJob() {}

    public static class SalesMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text customerId = new Text();
        private final Text challan = new Text();

        @Override
        protected void map(LongWritable offset, Text value, Context context) throws IOException, InterruptedException {
            if (value.toString().isBlank()) return;
            try {
                List<String> fields = CsvUtils.parse(value.toString());
                if (CsvUtils.isHeader(fields, "challan_id")) return;
                if (fields.size() != 5) throw new IOException("Expected five columns.");
                String status = CsvUtils.field(fields, 3);
                if (!status.equalsIgnoreCase("CONFIRMED")) {
                    if (status.equalsIgnoreCase("DRAFT") || status.equalsIgnoreCase("CANCELLED")) return;
                    throw new IOException("Unsupported challan status.");
                }
                String challanId = CsvUtils.field(fields, 0);
                String customer = CsvUtils.field(fields, 1);
                if (challanId.isEmpty() || customer.isEmpty()) throw new IOException("Required identifier is missing.");
                String name = CsvUtils.safeText(CsvUtils.field(fields, 2));
                if (name.isEmpty()) name = customer;
                long amount;
                try {
                    amount = CsvUtils.cents(CsvUtils.field(fields, 4));
                    if (amount < 0) throw new NumberFormatException("Amount must not be negative.");
                } catch (NumberFormatException | ArithmeticException exception) {
                    context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
                    return;
                }
                customerId.set(customer);
                challan.set(String.join("\t", challanId, name, Long.toString(amount)));
                context.write(customerId, challan);
            } catch (IOException exception) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
            }
        }
    }

    public static class SalesReducer extends Reducer<Text, Text, Text, Text> {
        @Override
        protected void reduce(Text customerId, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            Map<String, String> uniqueChallans = new HashMap<>();
            String customerName = null;
            for (Text value : values) {
                String encoded = value.toString();
                String[] fields = encoded.split("\t", -1);
                if (fields.length != 3) throw new IOException("Invalid intermediate customer record.");
                String previous = uniqueChallans.putIfAbsent(fields[0], encoded);
                if (previous != null) {
                    if (!previous.equals(encoded)) throw new IOException("Conflicting duplicate challan: " + fields[0]);
                    context.getCounter("INPUT_VALIDATION", "DUPLICATE_RECORDS").increment(1);
                }
                if (customerName == null || fields[1].compareTo(customerName) < 0) customerName = fields[1];
            }

            long totalCents = 0;
            try {
                for (String record : uniqueChallans.values()) {
                    totalCents = Math.addExact(totalCents, Long.parseLong(record.split("\t", -1)[2]));
                }
            } catch (ArithmeticException | NumberFormatException exception) {
                throw new IOException("Customer sales total overflow or invalid intermediate value.", exception);
            }
            if (customerName == null) customerName = customerId.toString();
            context.write(customerId, new Text(CsvUtils.safeText(customerName) + "\t" + uniqueChallans.size()
                    + "\t" + CsvUtils.money(totalCents)));
        }
    }

    private record CustomerTotal(String id, String name, long transactions, long cents) {}

    public static class TopCustomerMapper extends Mapper<LongWritable, Text, Text, Text> {
        private static final Text TOP_KEY = new Text("TOP_CUSTOMERS");

        @Override
        protected void map(LongWritable offset, Text value, Context context) throws IOException, InterruptedException {
            String line = value.toString();
            if (line.isBlank() || line.startsWith("TOP_")) return;
            String[] columns = line.split("\t", -1);
            if (columns.length != 4) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
                return;
            }
            try {
                long transactions = Long.parseLong(columns[2]);
                long cents = CsvUtils.cents(columns[3]);
                context.write(TOP_KEY, new Text(String.join("\t", columns[0],
                        CsvUtils.safeText(columns[1]), Long.toString(transactions), Long.toString(cents))));
            } catch (NumberFormatException | ArithmeticException exception) {
                context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
            }
        }
    }

    public static class TopCustomerReducer extends Reducer<Text, Text, Text, Text> {
        private final Comparator<CustomerTotal> worstFirst = Comparator.comparingLong(CustomerTotal::cents)
                .thenComparing(CustomerTotal::id, Comparator.reverseOrder());

        @Override
        protected void reduce(Text key, Iterable<Text> values, Context context) throws IOException, InterruptedException {
            PriorityQueue<CustomerTotal> top = new PriorityQueue<>(TOP_CUSTOMER_LIMIT, worstFirst);
            for (Text value : values) {
                String[] fields = value.toString().split("\t", -1);
                if (fields.length != 4) throw new IOException("Invalid customer ranking record.");
                CustomerTotal candidate = new CustomerTotal(fields[0], fields[1],
                        Long.parseLong(fields[2]), Long.parseLong(fields[3]));
                if (top.size() < TOP_CUSTOMER_LIMIT) {
                    top.add(candidate);
                } else if (worstFirst.compare(candidate, top.peek()) > 0) {
                    top.remove();
                    top.add(candidate);
                }
            }
            List<CustomerTotal> ranked = new ArrayList<>(top);
            ranked.sort(worstFirst.reversed());
            int rank = 1;
            for (CustomerTotal customer : ranked) {
                context.write(new Text(String.format("TOP_%02d", rank++)),
                        new Text(customer.id() + "\t" + CsvUtils.safeText(customer.name()) + "\t"
                                + customer.transactions() + "\t" + CsvUtils.money(customer.cents())));
            }
        }
    }

    private static Job summaryJob(Configuration configuration, Path input, Path output) throws IOException {
        Job job = Job.getInstance(configuration, "FundsRoom Customer Sales Summary");
        job.setJarByClass(CustomerSalesJob.class);
        job.setMapperClass(SalesMapper.class);
        job.setReducerClass(SalesReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);
        FileInputFormat.addInputPath(job, input);
        FileOutputFormat.setOutputPath(job, output);
        return job;
    }

    private static Job topCustomersJob(Configuration configuration, Path input, Path output) throws IOException {
        Job job = Job.getInstance(configuration, "FundsRoom Top Customers");
        job.setJarByClass(CustomerSalesJob.class);
        job.setMapperClass(TopCustomerMapper.class);
        job.setReducerClass(TopCustomerReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);
        FileInputFormat.addInputPath(job, input);
        FileOutputFormat.setOutputPath(job, output);
        return job;
    }

    public static void main(String[] args) throws Exception {
        JobSupport.requireArguments(args, 2, "CustomerSalesJob <input.csv> <new-output-directory>");
        Configuration configuration = JobSupport.localConfiguration();
        Path output = new Path(args[1]);
        JobSupport.requirePathAbsent(output, configuration);
        Path totals = new Path(output, "customer_totals");
        Path top = new Path(output, "top_customers");
        if (JobSupport.run(summaryJob(configuration, new Path(args[0]), totals), totals) != 0) System.exit(1);
        System.exit(JobSupport.run(topCustomersJob(configuration, totals, top), top));
    }
}
