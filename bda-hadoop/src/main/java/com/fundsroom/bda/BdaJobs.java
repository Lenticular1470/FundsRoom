package com.fundsroom.bda;

import java.util.Arrays;

public final class BdaJobs {
    private BdaJobs() {}

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            throw new IllegalArgumentException(
                    "Usage: BdaJobs <product-sales|customer-sales|inventory|challan-summary> <job arguments...>");
        }
        String[] jobArguments = Arrays.copyOfRange(args, 1, args.length);
        switch (args[0].toLowerCase()) {
            case "product-sales" -> ProductSalesJob.main(jobArguments);
            case "customer-sales" -> CustomerSalesJob.main(jobArguments);
            case "inventory" -> InventoryAnalysisJob.main(jobArguments);
            case "challan-summary" -> ChallanSummaryJob.main(jobArguments);
            case "date-sales" -> DailyMonthlySalesJob.main(jobArguments);
            default -> throw new IllegalArgumentException("Unknown job name: " + args[0]);
        }
    }
}
