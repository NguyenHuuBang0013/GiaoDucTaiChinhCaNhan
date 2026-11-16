package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record Category(long categoryId, long userId, String name, String categoryType, boolean sampleData) {}
