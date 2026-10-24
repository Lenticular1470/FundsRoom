package com.fundsroom.bda;

import java.io.IOException;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.FileSystem;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.mapreduce.Job;

final class JobSupport {
    private JobSupport() {}

    static Configuration localConfiguration() {
        Configuration configuration = new Configuration();
        configuration.set("mapreduce.framework.name", "local");
        configuration.set("mapreduce.jobtracker.address", "local");
        configuration.set("fs.defaultFS", "file:///");
        return configuration;
    }

    static int run(Job job, Path outputPath) throws IOException, InterruptedException, ClassNotFoundException {
        requirePathAbsent(outputPath, job.getConfiguration());
        boolean success = job.waitForCompletion(true);
        if (success) {
            printCounters(job);
            System.out.println("Output: " + outputPath);
            return 0;
        }
        return 1;
    }

    static void requirePathAbsent(Path path, Configuration configuration) throws IOException {
        FileSystem fileSystem = path.getFileSystem(configuration);
        if (fileSystem.exists(path)) {
            throw new IOException("Output path already exists; choose a new output path: " + path);
        }
    }

    static void requireArguments(String[] args, int expected, String usage) {
        if (args.length != expected) throw new IllegalArgumentException("Usage: " + usage);
    }

    private static void printCounters(Job job) throws IOException {
        var counters = job.getCounters().getGroup("INPUT_VALIDATION");
        System.out.printf("%s: malformed=%d invalidNumeric=%d invalidDates=%d duplicates=%d%n",
                "INPUT_VALIDATION",
                counters.findCounter("MALFORMED_RECORDS").getValue(),
                counters.findCounter("INVALID_NUMERIC_VALUES").getValue(),
                counters.findCounter("INVALID_DATES").getValue(),
                counters.findCounter("DUPLICATE_RECORDS").getValue());
    }
}
