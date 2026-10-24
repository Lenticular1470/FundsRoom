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
import org.apache.hadoop.mapreduce.lib.input.MultipleInputs;
import org.apache.hadoop.mapreduce.lib.input.TextInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public final class InventoryAnalysisJob {
    private InventoryAnalysisJob() {}

    public static class ProductMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text productId = new Text();
        private final Text snapshot = new Text();

        @Override
        protected void map(LongWritable offset, Text value, Context context) throws IOException, InterruptedException {
            if (value.toString().isBlank()) return;
            try {
                List<String> fields = CsvUtils.parse(value.toString());
                if (CsvUtils.isHeader(fields, "product_id")) return;
                if (fields.size() != 7) throw new IOException("Expected seven product columns.");
                String id = CsvUtils.field(fields, 0);
                if (id.isEmpty()) throw new IOException("Product ID is required.");
                long stock;
                long minimum;
                long price;
                try {
                    stock = CsvUtils.field(fields, 3).isEmpty() ? 0 : Long.parseLong(CsvUtils.field(fields, 3));
                    minimum = CsvUtils.field(fields, 4).isEmpty() ? 0 : CsvUtils.nonNegativeLong(CsvUtils.field(fields, 4));
                    price = CsvUtils.field(fields, 5).isEmpty() ? 0 : CsvUtils.cents(CsvUtils.field(fields, 5));
                    if (price < 0) throw new NumberFormatException("Price must not be negative.");
                } catch (NumberFormatException | ArithmeticException exception) {
                    context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
                    return;
                }
                String sku = CsvUtils.safeText(CsvUtils.field(fields, 1));
                String name = CsvUtils.safeText(CsvUtils.field(fields, 2));
                String warehouse = CsvUtils.safeText(CsvUtils.field(fields, 6));
                productId.set(id);
                snapshot.set(String.join("\t", "S", sku, name, Long.toString(stock), Long.toString(minimum),
                        Long.toString(price), warehouse));
                context.write(productId, snapshot);
            } catch (IOException exception) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
            }
        }
    }

    public static class MovementMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text productId = new Text();
        private final Text movement = new Text();

        @Override
        protected void map(LongWritable offset, Text value, Context context) throws IOException, InterruptedException {
            if (value.toString().isBlank()) return;
            try {
                List<String> fields = CsvUtils.parse(value.toString());
                if (CsvUtils.isHeader(fields, "movement_id")) return;
                if (fields.size() != 6) throw new IOException("Expected six movement columns.");
                String movementId = CsvUtils.field(fields, 0);
                String id = CsvUtils.field(fields, 1);
                String type = CsvUtils.field(fields, 2).toUpperCase(Locale.ROOT);
                if (movementId.isEmpty() || id.isEmpty()) throw new IOException("Movement and product IDs are required.");
                if (!type.equals("IN") && !type.equals("OUT")) throw new IOException("Movement type must be IN or OUT.");
                long quantity;
                try {
                    quantity = CsvUtils.positiveLong(CsvUtils.field(fields, 3));
                } catch (NumberFormatException exception) {
                    context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
                    return;
                }
                productId.set(id);
                movement.set(String.join("\t", "M", movementId, type, Long.toString(quantity)));
                context.write(productId, movement);
            } catch (IOException exception) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
            }
        }
    }

    public static class InventoryReducer extends Reducer<Text, Text, Text, Text> {
        @Override
        protected void reduce(Text productId, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            String snapshot = null;
            Map<String, String> movements = new HashMap<>();
            for (Text value : values) {
                String encoded = value.toString();
                String[] fields = encoded.split("\t", -1);
                if (fields.length == 7 && fields[0].equals("S")) {
                    if (snapshot != null && !snapshot.equals(encoded)) {
                        throw new IOException("Conflicting duplicate product snapshot: " + productId);
                    }
                    if (snapshot != null) context.getCounter("INPUT_VALIDATION", "DUPLICATE_RECORDS").increment(1);
                    snapshot = encoded;
                } else if (fields.length == 4 && fields[0].equals("M")) {
                    String previous = movements.putIfAbsent(fields[1], encoded);
                    if (previous != null) {
                        if (!previous.equals(encoded)) throw new IOException("Conflicting duplicate movement: " + fields[1]);
                        context.getCounter("INPUT_VALIDATION", "DUPLICATE_RECORDS").increment(1);
                    }
                } else {
                    throw new IOException("Invalid inventory intermediate record.");
                }
            }

            long stock = 0;
            long minimum = 0;
            long price = 0;
            String sku = "";
            String name = "";
            String warehouse = "";
            boolean foundSnapshot = snapshot != null;
            if (foundSnapshot) {
                String[] fields = snapshot.split("\t", -1);
                sku = fields[1];
                name = fields[2];
                stock = Long.parseLong(fields[3]);
                minimum = Long.parseLong(fields[4]);
                price = Long.parseLong(fields[5]);
                warehouse = fields[6];
            }
            long inbound = 0;
            long outbound = 0;
            try {
                for (String encoded : movements.values()) {
                    String[] fields = encoded.split("\t", -1);
                    long quantity = Long.parseLong(fields[3]);
                    if (fields[2].equals("IN")) inbound = Math.addExact(inbound, quantity);
                    else outbound = Math.addExact(outbound, quantity);
                }
                long stockValue = Math.multiplyExact(stock, price);
                String lowStock = foundSnapshot && stock <= minimum ? "LOW" : "OK";
                String availability = foundSnapshot ? "SNAPSHOT" : "NO_SNAPSHOT";
                context.write(productId, new Text(String.join("\t", sku, name, Long.toString(stock),
                        Long.toString(minimum), lowStock, CsvUtils.money(stockValue), warehouse,
                        Long.toString(inbound), Long.toString(outbound), availability)));
            } catch (ArithmeticException | NumberFormatException exception) {
                throw new IOException("Inventory total overflow or invalid intermediate value.", exception);
            }
        }
    }

    public static Job createJob(Configuration configuration, Path products, Path movements, Path output)
            throws IOException {
        Job job = Job.getInstance(configuration, "FundsRoom Inventory Analysis");
        job.setJarByClass(InventoryAnalysisJob.class);
        MultipleInputs.addInputPath(job, products, TextInputFormat.class, ProductMapper.class);
        MultipleInputs.addInputPath(job, movements, TextInputFormat.class, MovementMapper.class);
        job.setReducerClass(InventoryReducer.class);
        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(Text.class);
        FileOutputFormat.setOutputPath(job, output);
        return job;
    }

    public static void main(String[] args) throws Exception {
        JobSupport.requireArguments(args, 3,
                "InventoryAnalysisJob <products.csv> <stock-movements.csv> <new-output-directory>");
        Path output = new Path(args[2]);
        System.exit(JobSupport.run(createJob(JobSupport.localConfiguration(), new Path(args[0]),
                new Path(args[1]), output), output));
    }
}
