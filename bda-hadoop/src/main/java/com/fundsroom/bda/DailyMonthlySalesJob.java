package com.fundsroom.bda;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
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

public final class DailyMonthlySalesJob {
    private static final String AS_OF_DATE = "fundsroom.date-sales.as-of";
    private static final String WINDOW_MARKER = "__WINDOW__";
    private static final String NO_ITEM = "__NO_ITEM__";

    private DailyMonthlySalesJob() {}

    public static class SalesMapper extends Mapper<LongWritable, Text, Text, Text> {
        private final Text key = new Text();
        private final Text value = new Text();
        private LocalDate firstMonth;
        private LocalDate lastMonth;

        @Override
        protected void setup(Context context) throws IOException, InterruptedException {
            String configuredDate = context.getConfiguration().get(AS_OF_DATE);
            LocalDate asOfDate;
            try {
                asOfDate = configuredDate == null
                        ? LocalDate.now(ZoneOffset.UTC)
                        : LocalDate.parse(configuredDate);
            } catch (DateTimeParseException exception) {
                throw new IOException("As-of date must use yyyy-MM-dd.", exception);
            }
            lastMonth = asOfDate.withDayOfMonth(1);
            firstMonth = lastMonth.minusMonths(5);

            for (int index = 0; index < 6; index++) {
                key.set(monthKey(firstMonth.plusMonths(index)));
                value.set(WINDOW_MARKER);
                context.write(key, value);
            }
        }

        @Override
        protected void map(LongWritable offset, Text input, Context context)
                throws IOException, InterruptedException {
            String line = input.toString();
            if (line.isBlank()) return;

            List<String> fields;
            try {
                fields = CsvUtils.parse(line);
                if (CsvUtils.isHeader(fields, "challan_id")) return;
                if (fields.size() != 10) throw new IOException("Expected ten challan-item columns.");
            } catch (IOException exception) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
                return;
            }

            String status = CsvUtils.field(fields, 3);
            if (!status.equalsIgnoreCase("CONFIRMED")) {
                if (status.equalsIgnoreCase("DRAFT") || status.equalsIgnoreCase("CANCELLED")) return;
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
                return;
            }

            String challanId = CsvUtils.field(fields, 0);
            String itemId = CsvUtils.field(fields, 5);
            if (challanId.isEmpty()) {
                context.getCounter("INPUT_VALIDATION", "MALFORMED_RECORDS").increment(1);
                return;
            }

            LocalDate day;
            try {
                day = Instant.parse(CsvUtils.field(fields, 9)).atZone(ZoneOffset.UTC).toLocalDate();
            } catch (DateTimeParseException exception) {
                context.getCounter("INPUT_VALIDATION", "INVALID_DATES").increment(1);
                return;
            }

            long quantity = 0;
            long priceCents = 0;
            if (!itemId.isEmpty()) {
                try {
                    quantity = CsvUtils.positiveLong(CsvUtils.field(fields, 7));
                    priceCents = CsvUtils.cents(CsvUtils.field(fields, 8));
                    if (priceCents < 0) throw new NumberFormatException("Price must not be negative.");
                } catch (NumberFormatException | ArithmeticException exception) {
                    context.getCounter("INPUT_VALIDATION", "INVALID_NUMERIC_VALUES").increment(1);
                    itemId = "__INVALID__" + itemId;
                }
            } else {
                itemId = NO_ITEM;
            }

            String record = String.join("\t", challanId, itemId,
                    Long.toString(quantity), Long.toString(priceCents));
            key.set(dayKey(day));
            value.set(record);
            context.write(key, value);

            YearMonth month = YearMonth.from(day);
            if (!month.atDay(1).isBefore(firstMonth) && !month.atDay(1).isAfter(lastMonth)) {
                key.set(monthKey(month.atDay(1)));
                context.write(key, value);
            }
        }
    }

    private static final class ChallanSales {
        private final Map<String, String> items = new HashMap<>();
    }

    public static class SalesReducer extends Reducer<Text, Text, Text, Text> {
        @Override
        protected void reduce(Text bucket, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            Map<String, ChallanSales> challans = new HashMap<>();
            for (Text value : values) {
                String encoded = value.toString();
                if (encoded.equals(WINDOW_MARKER)) continue;
                String[] fields = encoded.split("\t", -1);
                if (fields.length != 4) throw new IOException("Invalid intermediate sales record.");
                ChallanSales challan = challans.computeIfAbsent(fields[0], ignored -> new ChallanSales());
                String item = String.join("\t", fields[1], fields[2], fields[3]);
                String previous = challan.items.putIfAbsent(fields[1], item);
                if (previous != null) {
                    if (!previous.equals(item)) {
                        throw new IOException("Conflicting duplicate challan item: " + fields[1]);
                    }
                    context.getCounter("INPUT_VALIDATION", "DUPLICATE_RECORDS").increment(1);
                }
            }

            long revenueCents = 0;
            long confirmedChallans = challans.size();
            try {
                for (ChallanSales challan : challans.values()) {
                    for (String item : challan.items.values()) {
                        String[] fields = item.split("\t", -1);
                        revenueCents = Math.addExact(revenueCents,
                                Math.multiplyExact(Long.parseLong(fields[1]), Long.parseLong(fields[2])));
                    }
                }
            } catch (ArithmeticException | NumberFormatException exception) {
                throw new IOException("Date sales total overflow or invalid intermediate value.", exception);
            }

            context.write(bucket, new Text(confirmedChallans + "\t" + CsvUtils.money(revenueCents)));
        }
    }

    private static String dayKey(LocalDate date) {
        return "DAILY|" + date;
    }

    private static String monthKey(LocalDate date) {
        return "MONTH|" + YearMonth.from(date);
    }

    public static Job createJob(Configuration configuration, Path input, Path output, LocalDate asOfDate)
            throws IOException {
        configuration.set(AS_OF_DATE, asOfDate.toString());
        Job job = Job.getInstance(configuration, "FundsRoom Daily and Monthly Sales");
        job.setJarByClass(DailyMonthlySalesJob.class);
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
        if (args.length != 2 && args.length != 3) {
            throw new IllegalArgumentException(
                    "Usage: DailyMonthlySalesJob <challan-items.csv> <new-output-directory> [as-of-date-yyyy-MM-dd]");
        }
        LocalDate asOfDate;
        try {
            asOfDate = args.length == 3 ? LocalDate.parse(args[2]) : LocalDate.now(ZoneOffset.UTC);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException("As-of date must use yyyy-MM-dd.", exception);
        }
        Path output = new Path(args[1]);
        System.exit(JobSupport.run(createJob(JobSupport.localConfiguration(), new Path(args[0]), output, asOfDate), output));
    }
}
