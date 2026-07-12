<?php
/* =====================================================================
   Father & Sons Manpower Supply — Job application handler
   Receives the job-seeker form (multipart/form-data), validates it,
   and emails the application + CV attachment to the recruitment inbox
   using the Resend API (https://resend.com).

   HOSTING: works on any Hostinger / shared PHP host with cURL enabled.
   Place this file at:  <site-root>/api/apply.php
   The front-end posts to:  api/apply.php

   SETUP (2 minutes):
   1. Copy config.example.php  ->  config.php  (same /api folder)
   2. Put your Resend API key in config.php
   3. Once your domain is verified in Resend, change MAIL_FROM below to
      an address on your domain (e.g. careers@fnsms.com).
   ===================================================================== */

/* ---------- addresses (EDIT THESE) ---------- */
// Until fnsms.com is verified in Resend, use the Resend test sender.
// Test mode note: Resend only delivers to your OWN account email while unverified.
const MAIL_FROM      = 'Father & Sons Careers <onboarding@resend.dev>';   // ← after verifying: 'Father & Sons Careers <careers@fnsms.com>'
const MAIL_TO        = 'info@fnsms.com';                                  // where applications land
const MAIL_SUBJECT   = 'New Job Application';

/* ---------- limits ---------- */
const CV_MAX_BYTES   = 5 * 1024 * 1024;                                   // 5 MB
$CV_ALLOWED_EXT      = ['pdf', 'doc', 'docx'];
$CV_ALLOWED_MIME     = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/* ---------- boilerplate ---------- */
header('Content-Type: application/json; charset=utf-8');

function out($code, $arr){ http_response_code($code); echo json_encode($arr); exit; }
function clean($v){ return trim(str_replace(["\r", "\n"], ' ', (string)$v)); }
function esc($v){ return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
  out(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

/* ---------- API key ---------- */
$RESEND_API_KEY = getenv('RESEND_API_KEY');
if(!$RESEND_API_KEY && is_file(__DIR__ . '/config.php')){
  $cfg = require __DIR__ . '/config.php';
  if(is_array($cfg) && !empty($cfg['RESEND_API_KEY'])) $RESEND_API_KEY = $cfg['RESEND_API_KEY'];
}
if(!$RESEND_API_KEY){
  out(500, ['ok' => false, 'error' => 'Email service is not configured yet. Please email info@fnsms.com directly.']);
}

/* ---------- honeypot (bots fill this; humans never see it) ---------- */
if(!empty($_POST['website'])){
  out(200, ['ok' => true, 'message' => 'Application sent! Our recruitment team will be in touch.']); // silently accept & drop
}

/* ---------- fields ---------- */
$name       = clean($_POST['name']       ?? '');
$email      = clean($_POST['email']      ?? '');
$phone      = clean($_POST['phone']      ?? '');
$position   = clean($_POST['position']   ?? '');
$experience = clean($_POST['experience'] ?? '');
$country    = clean($_POST['country']    ?? '');
$message    = trim($_POST['message']     ?? '');

if($name === '' || $email === ''){
  out(422, ['ok' => false, 'error' => 'Please enter your name and email.']);
}
if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
  out(422, ['ok' => false, 'error' => 'Please enter a valid email address.']);
}

/* ---------- CV file ---------- */
if(!isset($_FILES['cv']) || $_FILES['cv']['error'] === UPLOAD_ERR_NO_FILE){
  out(422, ['ok' => false, 'error' => 'Please attach your CV (PDF, DOC or DOCX).']);
}
$cv = $_FILES['cv'];
if($cv['error'] !== UPLOAD_ERR_OK){
  $msg = $cv['error'] === UPLOAD_ERR_INI_SIZE || $cv['error'] === UPLOAD_ERR_FORM_SIZE
    ? 'Your CV is larger than the server allows. Please keep it under 5 MB.'
    : 'Could not read the uploaded CV. Please try again.';
  out(422, ['ok' => false, 'error' => $msg]);
}
if($cv['size'] > CV_MAX_BYTES){
  out(422, ['ok' => false, 'error' => 'CV is too large. Maximum is 5 MB.']);
}
$ext = strtolower(pathinfo($cv['name'], PATHINFO_EXTENSION));
if(!in_array($ext, $CV_ALLOWED_EXT, true)){
  out(422, ['ok' => false, 'error' => 'CV must be a PDF, DOC or DOCX file.']);
}
/* verify real MIME type, not just the extension */
$finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : null;
$mime  = $finfo ? finfo_file($finfo, $cv['tmp_name']) : ($cv['type'] ?? '');
if($finfo) finfo_close($finfo);
if($mime && !in_array($mime, $CV_ALLOWED_MIME, true)){
  out(422, ['ok' => false, 'error' => 'CV must be a valid PDF, DOC or DOCX file.']);
}

$cvData = file_get_contents($cv['tmp_name']);
if($cvData === false){
  out(500, ['ok' => false, 'error' => 'Could not process the CV. Please try again.']);
}
$safeName = preg_replace('/[^A-Za-z0-9._-]/', '_', $cv['name']);
$cvFilename = 'CV-' . preg_replace('/[^A-Za-z0-9]+/', '-', $name) . '.' . $ext;

/* ---------- build the email ---------- */
$rows = [
  ['Name', $name],
  ['Email', $email],
  ['Phone / WhatsApp', $phone ?: '—'],
  ['Position / Trade', $position ?: '—'],
  ['Experience', $experience ?: '—'],
  ['Preferred Country', $country ?: '—'],
];
$rowsHtml = '';
foreach($rows as $r){
  $rowsHtml .= '<tr>'
    . '<td style="padding:8px 14px;border:1px solid #eee;background:#faf8f3;font-weight:600;white-space:nowrap;">' . esc($r[0]) . '</td>'
    . '<td style="padding:8px 14px;border:1px solid #eee;">' . esc($r[1]) . '</td>'
    . '</tr>';
}
$noteHtml = $message !== ''
  ? '<p style="margin:18px 0 6px;font-weight:600;">Cover note</p><p style="margin:0;white-space:pre-wrap;color:#333;">' . esc($message) . '</p>'
  : '';

$html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#14130f;max-width:640px;">'
  . '<h2 style="margin:0 0 4px;">New job application</h2>'
  . '<p style="margin:0 0 18px;color:#666;">Submitted via the Careers page on fnsms.com</p>'
  . '<table style="border-collapse:collapse;font-size:14px;width:100%;">' . $rowsHtml . '</table>'
  . $noteHtml
  . '<p style="margin:20px 0 0;color:#666;font-size:13px;">CV is attached to this email.</p>'
  . '</div>';

$text = "New job application (fnsms.com)\n\n"
  . "Name: $name\nEmail: $email\nPhone: " . ($phone ?: '-') . "\n"
  . "Position: " . ($position ?: '-') . "\nExperience: " . ($experience ?: '-') . "\n"
  . "Preferred country: " . ($country ?: '-') . "\n\n"
  . ($message !== '' ? "Cover note:\n$message\n\n" : '')
  . "CV attached.";

$payload = [
  'from'        => MAIL_FROM,
  'to'          => [MAIL_TO],
  'reply_to'    => $email,                 // reply goes straight to the applicant
  'subject'     => MAIL_SUBJECT . ' — ' . $name . ($position ? " ($position)" : ''),
  'html'        => $html,
  'text'        => $text,
  'attachments' => [[
    'filename' => $cvFilename,
    'content'  => base64_encode($cvData),
  ]],
];

/* ---------- send via Resend ---------- */
$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST           => true,
  CURLOPT_HTTPHEADER     => [
    'Authorization: Bearer ' . $RESEND_API_KEY,
    'Content-Type: application/json',
  ],
  CURLOPT_POSTFIELDS     => json_encode($payload),
  CURLOPT_TIMEOUT        => 30,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if($curlErr){
  out(502, ['ok' => false, 'error' => 'Could not reach the email service. Please email info@fnsms.com directly.']);
}
if($httpCode >= 200 && $httpCode < 300){
  out(200, ['ok' => true, 'message' => 'Application sent! Our recruitment team will review your CV and be in touch.']);
}

/* surface Resend's error message when helpful */
$err = 'Sending failed. Please email your CV to info@fnsms.com directly.';
$decoded = json_decode($response, true);
if(is_array($decoded) && !empty($decoded['message'])) $err = 'Sending failed: ' . $decoded['message'];
out(502, ['ok' => false, 'error' => $err]);
