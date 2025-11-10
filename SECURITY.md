# File Upload Security Documentation

## Overview
This document outlines the security measures implemented for file upload functionality in the Marketplace application.

## Security Features Implemented

### 1. File Size Limits
- **Middleware Limit**: 10MB per file (aligned with validation)
- **Validation Limit**: 10MB per file
- **Request Limits**:
  - Maximum 10 files per request
  - Maximum 100 fields per request
  - Maximum 1MB per field

### 2. File Type Validation
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Magic Byte Validation**: Ensures file content matches declared MIME type
- **Content Scanning**: Checks for malicious patterns in first 1KB of file

### 3. Filename Security
- **Path Traversal Protection**: Blocks filenames containing `..`, `/`, `\`
- **Safe Naming**: express-fileupload automatically sanitizes filenames
- **Extension Preservation**: Maintains original extensions for validation

### 4. Upload Directory Security
- **Static File Serving**: Protected with security headers
- **Directory Listing**: Disabled (index: false)
- **Hidden Files**: Denied access (dotfiles: 'deny')
- **Content-Type Validation**: Only serves allowed image types

### 5. Security Headers
- **Cache-Control**: 1-year cache for performance
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filtering

### 6. Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **File Uploads**: 20 uploads per hour
- **Product Operations**: 50 operations per hour

### 7. Error Handling
- **Comprehensive Error Messages**: Specific error types for different failure modes
- **Upload Library Errors**: Handles LIMIT_* error codes
- **Validation Failures**: Clear messages for invalid files

### 8. Temporary File Management
- **Automatic Cleanup**: Removes temp files older than 1 hour
- **Secure Temp Directory**: Uses system temp directory with safe naming

## Known Limitations

### Areas for Future Enhancement
1. **Image Dimension Validation**: Currently not implemented due to complexity
2. **Advanced Content Scanning**: No virus/malware scanning
3. **Storage Quotas**: No per-user upload limits
4. **CDN Integration**: Files served directly from server

### Potential Security Considerations
1. **Database Storage**: Image URLs stored in database - ensure proper access controls
2. **File Permissions**: Uploaded files should have restricted permissions
3. **Backup Security**: Ensure uploaded files are included in secure backups
4. **Monitoring**: Implement logging for upload attempts and failures

## Testing Recommendations

### Manual Testing Scenarios
1. Upload valid images (JPEG, PNG, GIF, WebP)
2. Attempt invalid file types (EXE, PDF, scripts)
3. Test file size limits (exactly 10MB, over 10MB)
4. Path traversal attempts (`../../../etc/passwd`)
5. Empty files and corrupted files
6. Multiple file uploads (11 files for 10 limit)
7. Rate limit testing (rapid successive uploads)

### Automated Testing
Use the provided `test-upload-scenarios.js` script to run comprehensive tests:

```bash
# Set auth token for admin operations
export AUTH_TOKEN="your-jwt-token-here"
node test-upload-scenarios.js
```

## Security Best Practices Followed

1. **Defense in Depth**: Multiple validation layers
2. **Fail-Safe Defaults**: Strict allowlists for file types
3. **Input Validation**: All inputs validated before processing
4. **Error Handling**: Secure error messages (no path disclosure)
5. **Resource Limits**: Prevent DoS through size and rate limits
6. **Secure Headers**: Modern security headers implemented

## Monitoring and Maintenance

### Regular Checks
1. Monitor upload logs for suspicious activity
2. Review uploaded files periodically
3. Update dependencies regularly
4. Test security measures after updates

### Incident Response
1. Quarantine suspicious files
2. Review access logs
3. Update security measures if vulnerabilities found
4. Notify affected users if breach occurs

## Compliance Considerations

- **GDPR**: File uploads may contain personal data
- **Data Retention**: Implement file cleanup policies
- **User Consent**: Ensure users understand file storage policies
- **Data Portability**: Allow users to download/delete their files

## Contact

For security concerns or questions about file upload security, please contact the development team.
