package com.fundsroom.bda;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.ResultSetMetaData;
import java.util.Properties;

public final class JdbcCsvExporter {
    private static final String[] QUERIES = {
        """
        SELECT ci.id, ci.challan_id, ci.product_id, ci.product_name, ci.quantity,
               ci.price::text, c.status::text
        FROM challan_items ci
        JOIN challans c ON c.id = ci.challan_id
        ORDER BY ci.id
        """,
        """
        SELECT c.id, c.customer_id, cu.name, c.status::text,
               COALESCE(SUM(ci.price * ci.quantity), 0)::text AS total_amount
        FROM challans c
        JOIN customers cu ON cu.id = c.customer_id
        LEFT JOIN challan_items ci ON ci.challan_id = c.id
        GROUP BY c.id, c.customer_id, cu.name, c.status
        ORDER BY c.id
        """,
        """
        SELECT id, sku, name, current_stock, minimum_stock, price::text, warehouse
        FROM products
        ORDER BY id
        """,
        """
        SELECT id, product_id, movement_type::text, quantity, reason, created_at
        FROM stock_movements
        ORDER BY id
        """,
        """
        SELECT c.id, c.challan_number, c.customer_id, c.status::text,
               ci.id, ci.product_id, ci.product_name, ci.quantity, ci.price::text,
               to_char(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_utc
        FROM challans c
        LEFT JOIN challan_items ci ON ci.challan_id = c.id
        ORDER BY c.id, ci.id
        """
    };

    private static final String[] FILE_NAMES = {
        "product-sales.csv",
        "customer-sales.csv",
        "products.csv",
        "stock-movements.csv",
        "challan-items.csv"
    };

    private JdbcCsvExporter() {}

    public static void main(String[] args) {
        if (args.length != 1) {
            System.err.println("Usage: JdbcCsvExporter <new-output-directory>");
            System.exit(2);
        }

        String url = System.getenv("BDA_JDBC_URL");
        String user = System.getenv("BDA_DB_USER");
        String password = System.getenv("BDA_DB_PASSWORD");
        if (blank(url) || blank(user) || blank(password)) {
            System.err.println("Set BDA_JDBC_URL, BDA_DB_USER, and BDA_DB_PASSWORD in the process environment.");
            System.exit(2);
        }
        if (!url.startsWith("jdbc:postgresql:")) {
            System.err.println("BDA_JDBC_URL must use the PostgreSQL JDBC protocol.");
            System.exit(2);
        }

        try {
            export(Path.of(args[0]), url, user, password);
        } catch (SQLException | IOException exception) {
            System.err.println("Read-only export failed (" + exception.getClass().getSimpleName()
                    + "); database details are withheld.");
            System.exit(1);
        }
    }

    private static void export(Path output, String url, String user, String password)
            throws SQLException, IOException {
        Path absolute = output.toAbsolutePath().normalize();
        Path parent = absolute.getParent();
        if (parent == null) throw new IOException("Output directory must have a parent path.");
        Files.createDirectories(parent);
        Files.createDirectory(absolute);

        Properties properties = new Properties();
        properties.setProperty("user", user);
        properties.setProperty("password", password);
        properties.setProperty("sslmode", "require");
        properties.setProperty("ApplicationName", "FundsRoom-BDA-read-only-export");

        try (Connection connection = DriverManager.getConnection(url, properties)) {
            connection.setReadOnly(true);
            connection.setAutoCommit(false);
            try (var statement = connection.createStatement()) {
                statement.execute("SET TRANSACTION READ ONLY");
            }
            for (int index = 0; index < QUERIES.length; index++) {
                long rows = exportQuery(connection, QUERIES[index], absolute.resolve(FILE_NAMES[index]));
                System.out.printf("%s: %d rows%n", FILE_NAMES[index], rows);
            }
            connection.commit();
        } catch (SQLException | IOException exception) {
            throw exception;
        }
        System.out.println("Read-only CSV exports created in " + absolute);
    }

    private static long exportQuery(Connection connection, String sql, Path file)
            throws SQLException, IOException {
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setFetchSize(1000);
            statement.setQueryTimeout(300);
            try (ResultSet rows = statement.executeQuery();
                 BufferedWriter writer = Files.newBufferedWriter(file, StandardCharsets.UTF_8)) {
                ResultSetMetaData metadata = rows.getMetaData();
                int columns = metadata.getColumnCount();
                for (int column = 1; column <= columns; column++) {
                    if (column > 1) writer.write(',');
                    writeCsvField(writer, metadata.getColumnLabel(column));
                }
                writer.newLine();

                long count = 0;
                while (rows.next()) {
                    for (int column = 1; column <= columns; column++) {
                        if (column > 1) writer.write(',');
                        String value = rows.getString(column);
                        writeCsvField(writer, value == null ? "" : value.replace('\r', ' ').replace('\n', ' '));
                    }
                    writer.newLine();
                    count++;
                }
                return count;
            }
        }
    }

    private static void writeCsvField(BufferedWriter writer, String value) throws IOException {
        writer.write('"');
        writer.write(value.replace("\"", "\"\""));
        writer.write('"');
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
