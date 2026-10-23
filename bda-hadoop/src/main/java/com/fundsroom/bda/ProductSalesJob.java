package com.fundsroom.bda;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
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

public final class ProductSalesJob {
    private ProductSalesJob() {}

    public static class SalesMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text productId = new Text();
        private final Text record = new Text();

        @Override
        protected void map(LongWritable offset, Text value, Context context) throws IOException, InterruptedException {
            String line = value.toString();
            if (line.isBlank()) return;
            try {
                List<String> fields = CsvUtils.parse(line);
                if (CsvUtils.isHeader(fields, "line_item_id")) return;
                if (fields.size() != 7) throw new IOException("Expected seven columns.");
                String lineItemId = CsvUtils.field(fields, 0);
                String product = CsvUtils.field(fields, 2);
                String name = CsvUtils.safeText(CsvUtils.field(fields, 3));
                String status = CsvUtils.field(fields, 6);
                if (!status.equalsIgnoreCase("CONFIRMED")) {
                    if (status.equalsIgnoreCase("DRAFT") || status.equalsIgnoreCase("CANCELLED")) return;
                    throw new IOException("Unsupported challan status.");
                }
                if (lineItemId.isEmpty() || product.isEmpty()) throw new IOException("Required identifier is missing.");
                if (name.isEmpty()) name = product;

                long quantity;
                long unitPriceCents;
                try {
                    quantity = CsvUtils.positiveLong(CsvUtils.field(fields, 4));
                    unitPriceCents = CsvUtils.cents(CsvUtils.field(fields, 5));
                    if (unitPriceCents < 0) throw new NumberFormatException("Price must not be negative.");
                } catch (NumberFormatException | ArithmeticException exception) {
                    context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
                    return;
                }

                productId.set(product);
                record.set(String.join("\t", lineItemId, name, Long.toString(quantity), Long.toString(unitPriceCents)));
                context.write(productId, record);
            } catch (IOException exception) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
            }
        }
    }

    public static class SalesReducer extends Reducer<Text, Text, Text, Text> {
        @Override
        protected void reduce(Text productId, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            Map<String, String> uniqueLines = new HashMap<>();
            String productName = null;
            for (Text value : values) {
                String encoded = value.toString();
                String[] fields = encoded.split("\t", -1);
                if (fields.length != 4) throw new IOException("Invalid intermediate product record.");
                String previous = uniqueLines.putIfAbsent(fields[0], encoded);
                if (previous != null) {
                    if (!previous.equals(encoded)) throw new IOException("Conflicting duplicate line item: " + fields[0]);
                    context.getCounter("INPUT_VALIDATION", "DUPLICATE_RECORDS").increment(1);
                }
                if (productName == null || fields[1].compareTo(productName) < 0) productName = fields[1];
            }

            long quantity = 0;
            long revenueCents = 0;
            try {
                for (String line : uniqueLines.values()) {
                    String[] fields = line.split("\t", -1);
                    quantity = Math.addExact(quantity, Long.parseLong(fields[2]));
                    revenueCents = Math.addExact(revenueCents,
                            Math.multiplyExact(Long.parseLong(fields[2]), Long.parseLong(fields[3])));
                }
            } catch (ArithmeticException | NumberFormatException exception) {
                throw new IOException("Product sales total overflow or invalid intermediate value.", exception);
            }
            if (productName == null) productName = productId.toString();
            context.write(productId, new Text(CsvUtils.safeText(productName) + "\t" + quantity + "\t"
                    + CsvUtils.money(revenueCents)));
        }
    }

    public static Job createJob(Configuration configuration, Path input, Path output) throws IOException {
        Job job = Job.getInstance(configuration, "FundsRoom Product Sales Summary");
        job.setJarByClass(ProductSalesJob.class);
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

    public static void main(String[] args) throws Exception {
        JobSupport.requireArguments(args, 2, "ProductSalesJob <input.csv> <new-output-directory>");
        Path output = new Path(args[1]);
        System.exit(JobSupport.run(createJob(JobSupport.localConfiguration(), new Path(args[0]), output), output));
    }
}
