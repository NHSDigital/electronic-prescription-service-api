/**
 * The reasonCode is a non-critical CRL entry extension that identifies
   the reason for the certificate revocation.  CRL issuers are strongly
   encouraged to include meaningful reason codes in CRL entries;
   however, the reason code CRL entry extension SHOULD be absent instead
   of using the unspecified (0) reasonCode value.

   The removeFromCRL (8) reasonCode value may only appear in delta CRLs
   and indicates that a certificate is to be removed from a CRL because
   either the certificate expired or was removed from hold.  All other
   reason codes may appear in any CRL and indicate that the specified
   certificate should be considered revoked.

 * Source: https://www.rfc-editor.org/rfc/rfc5280#section-5.3.1

 * Revocation reasons:
   https://learn.microsoft.com/en-us/previous-versions/tn-archive/cc700843(v=technet.10)#revocation-reasons
 */

export enum CRLReasonCode {
  Unspecified = 0,
  KeyCompromise = 1,
  CACompromise = 2,
  AffiliationChanged = 3,
  Superseded = 4,
  CessationOfOperation = 5,
  CertificateHold = 6,
  // value 7 not used
  RemoveFromCRL = 8,
  PrivilegeWithdrawn = 9,
  AACompromise = 10
}
