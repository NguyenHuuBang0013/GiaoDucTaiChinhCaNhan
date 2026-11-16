package vn.edu.finance.model;
/** Domain data shape corresponding to SQL Server table. */
public record User(long userId, String oidcSubject, String email, String displayName) {}
