package com.fundsroom.bda;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public final class ChallanSummaryJob {
    private ChallanSummaryJob() {}

    public static class SummaryMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text statusKey = new Text();
        private final Text record = new Text();

        @Override
        protected void map(LongWritable offset, Text value, Context context) throws IOException, InterruptedException {
            if (value.toString().isBlank()) return;
            try {
                List<String> fields = CsvUtils.parse(value.toString());
                if (CsvUtils.isHeader(fields, "challan_id")) return;
                if (fields.size() != 10) throw new IOException("Expected ten challan-item columns.");
                String challanId = CsvUtils.field(fields, 0);
                String number = CsvUtils.safeText(CsvUtils.field(fields, 1));
                String status = CsvUtils.field(fields, 3).toUpperCase(Locale.ROOT);
                if (challanId.isEmpty()) throw new IOException("Challan ID is required.");
                if (!status.equals("DRAFT") && !status.equals("CONFIRMED") && !status.equals("CANCELLED")) {
                    throw new IOException("Unsupported challan status.");
                }
                String itemId = CsvUtils.field(fields, 4);
                long quantity = 0;
                long unitPriceCents = 0;
                if (!itemId.isEmpty()) {
                    try {
                        quantity = CsvUtils.positiveLong(CsvUtils.field(fields, 7));
                        unitPriceCents = CsvUtils.cents(CsvUtils.field(fields, 8));
                        if (unitPriceCents < 0) throw new NumberFormatException("Price must not be negative.");
                    } catch (NumberFormatException | ArithmeticException exception) {
                        context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
                        itemId = "__INVALID__" + itemId;
                    }
                }
                statusKey.set(status);
                record.set(String.join("\t", challanId, number, itemId.isEmpty() ? "__NO_ITEM__" : itemId,
                        Long.toString(quantity), Long.toString(unitPriceCents)));
                context.write(statusKey, record);
            } catch (IOException exception) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
            }
        }
    }

    private static final class ChallanTotal {
        private final String number;
        private final Map<String, String> items = new HashMap<>();

        private ChallanTotal(String number) {
            this.number = number;
        }
    }

    public static class SummaryReducer extends Reducer<Text, Text, Text, Text> {
        @Override
        protected void reduce(Text status, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            Map<String, ChallanTotal> challans = new HashMap<>();
            for (Text value : values) {
                String encoded = value.toString();
                String[] fields = encoded.split("\t", -1);
                if (fields.length != 5) throw new IOException("Invalid intermediate challan record.");
                ChallanTotal challan = challans.computeIfAbsent(fields[0], ignored -> new ChallanTotal(fields[1]));
                if (!challan.number.equals(fields[1])) throw new IOException("Conflicting challan number: " + fields[0]);
                String line = String.join("\t", fields[2], fields[3], fields[4]);
                String prior = challan.items.putIfAbsent(fields[2], line);
                if (prior != null) {
                    if (!prior.equals(line)) throw new IOException("Conflicting duplicate challan item: " + fields[2]);
                    context.getCounter("INPUT_VALIDATION", "DUPLICATE_RECORDS").increment(1);
                }
            }

            long itemQuantity = 0;
            long salesCents = 0;
            try {
                for (ChallanTotal challan : challans.values()) {
                    for (String line : challan.items.values()) {
                        String[] fields = line.split("\t", -1);
                        long quantity = Long.parseLong(fields[1]);
                        long unitPriceCents = Long.parseLong(fields[2]);
                        itemQuantity = Math.addExact(itemQuantity, quantity);
                        if (status.toString().equals("CONFIRMED")) {
                            salesCents = Math.addExact(salesCents, Math.multiplyExact(quantity, unitPriceCents));
                        }
                    }
                }
            } catch (ArithmeticException | NumberFormatException exception) {
                throw new IOException("Challan summary overflow or invalid intermediate value.", exception);
            }
            context.write(status, new Text(challans.size() + "\t" + itemQuantity + "\t" + CsvUtils.money(salesCents)));
        }
    }

    public static Job createJob(Configuration configuration, Path input, Path output) throws IOException {
        Job job = Job.getInstance(configuration, "FundsRoom Challan Summary");
        job.setJarByClass(ChallanSummaryJob.class);
        job.setMapperClass(SummaryMapper.class);
        job.setReducerClass(SummaryReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);
        FileInputFormat.addInputPath(job, input);
        FileOutputFormat.setOutputPath(job, output);
        return job;
    }

    public static void main(String[] args) throws Exception {
        JobSupport.requireArguments(args, 2, "ChallanSummaryJob <challan-items.csv> <new-output-directory>");
        Path output = new Path(args[1]);
        System.exit(JobSupport.run(createJob(JobSupport.localConfiguration(), new Path(args[0]), output), output));
    }
}
