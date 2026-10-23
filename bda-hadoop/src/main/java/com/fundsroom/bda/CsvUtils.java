package com.fundsroom.bda;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

final class CsvUtils {
    private CsvUtils() {}

    static List<String> parse(String line) throws IOException {
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        boolean afterQuote = false;

        for (int index = 0; index < line.length(); index++) {
            char current = line.charAt(index);
            if (quoted) {
                if (current == '"') {
                    if (index + 1 < line.length() && line.charAt(index + 1) == '"') {
                        field.append('"');
                        index++;
                    } else {
                        quoted = false;
                        afterQuote = true;
                    }
                } else {
                    field.append(current);
                }
                continue;
            }
            if (current == ',') {
                fields.add(field.toString());
                field.setLength(0);
                afterQuote = false;
                continue;
            }
            if (current == '"' && field.length() == 0 && !afterQuote) {
                quoted = true;
                continue;
            }
            if (afterQuote && current != ',') {
                throw new IOException("Unexpected character after a quoted CSV field.");
            }
            if (current == '"') {
                throw new IOException("Quote found inside an unquoted CSV field.");
            }
            field.append(current);
        }

        if (quoted) throw new IOException("Unterminated quoted CSV field.");
        fields.add(field.toString());
        return fields;
    }

    static String field(List<String> fields, int index) {
        return index < fields.size() ? fields.get(index).trim() : "";
    }

    static boolean isHeader(List<String> fields, String firstColumn) {
        return !fields.isEmpty() && fields.get(0).trim().equalsIgnoreCase(firstColumn);
    }

    static long positiveLong(String value) {
        long parsed = Long.parseLong(value);
        if (parsed <= 0) throw new NumberFormatException("Value must be positive.");
        return parsed;
    }

    static long nonNegativeLong(String value) {
        long parsed = Long.parseLong(value);
        if (parsed < 0) throw new NumberFormatException("Value must not be negative.");
        return parsed;
    }

    static long cents(String value) {
        return new BigDecimal(value).setScale(2, RoundingMode.UNNECESSARY)
                .movePointRight(2).longValueExact();
    }

    static String safeText(String value) {
        return value.replace('\t', ' ').replace('\r', ' ').replace('\n', ' ').trim();
    }

    static String money(long cents) {
        return BigDecimal.valueOf(cents, 2).toPlainString();
    }
}
