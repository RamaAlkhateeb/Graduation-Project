export interface EmailAddressDto {
  name?: string | null;
  address: string;
}

export interface EmailAttachmentDto {
  fileName: string;
  content: string; // base64 بدون prefix
  contentType: string;
}

export interface SendEmailRequest {
  to: EmailAddressDto[];
  cc?: EmailAddressDto[];
  bcc?: EmailAddressDto[];
  subject: string;
  htmlBody?: string | null;
  plainTextBody?: string | null;
  attachments?: EmailAttachmentDto[];
}

export interface SendTemplateEmailRequest extends SendEmailRequest {
  templateName: string;
  model?: unknown;
}