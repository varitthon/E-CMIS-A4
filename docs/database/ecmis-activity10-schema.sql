-- Generated from schema-10-*.json — do not edit by hand.

-- ===== 10.1 คดีอาญาทุจริตและคดีประพฤติมิชอบ
create schema if not exists act101;

create table act101.case_file (
  id bigint generated always as identity,
  case_no varchar(50) not null unique,
  title text,
  category varchar(10) default '10.1',
  category_name text,
  prosecutor_case_type_code varchar(5),
  prosecutor_case_type_other_text text,
  prosecutor_level_code varchar(5),
  prosecutor_level_other_text text,
  source_agency text,
  accuser text,
  accused text,
  accused_position text,
  officer_user_id varchar(50),
  officer_name varchar(200),
  officer_role varchar(50),
  officer_position text,
  pacc_case_no varchar(50),
  black_no varchar(50) default '-',
  red_no varchar(50) default '-',
  court_order text default 'คำสั่งไม่ฟ้องพนักงานอัยการ',
  statute_limitation_note text default '15 ปี',
  statute_limitation_expiry date,
  sla_total_days int default 15,
  date_received date,
  due_date date,
  doc_type text default 'เอกสารแนบสำนวน',
  doc_no varchar(100),
  summary text,
  legal_opinion text,
  law_receive_no varchar(50),
  central_saraban_no varchar(50),
  physical_doc_date date,
  status_code varchar(50),
  workflow_step int,
  is_completed boolean not null default false,
  case_closed_date date,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id)
);
comment on table act101.case_file is 'แฟ้มคดี — One row per case; the case-level intake, party, and current-status fields shared across every step.';
create index on act101.case_file (status_code);
create index on act101.case_file (case_no);

create table act101.status (
  code varchar(50),
  label_th text not null,
  step_code varchar(20),
  page varchar(100),
  role varchar(50),
  is_terminal boolean not null default false,
  primary key (code)
);
comment on table act101.status is 'สถานะงาน — Lookup of every statusCode used by the 10.1 flow, with owning role and page.';

create table act101.case_transition (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(50),
  from_status_code varchar(50),
  to_status_code varchar(50) not null,
  action varchar(30) not null,
  decision_code varchar(30),
  note text,
  actor_user_id varchar(50),
  actor_name varchar(200),
  actor_role varchar(50),
  acted_at timestamptz not null default now(),
  primary key (id)
);
comment on table act101.case_transition is 'ประวัติการเปลี่ยนสถานะ — Append-only audit of every submit/return/sign action; preserves send-back rounds that overwrite case_file columns.';
create index on act101.case_transition (case_id, acted_at);
create index on act101.case_transition (case_id, step_code);

create table act101.signature (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(50) not null,
  signer_role varchar(50),
  signer_name varchar(200),
  signer_user_id varchar(50),
  sign_method varchar(10) not null,
  cert_id varchar(100),
  image_data text,
  opinion_text text,
  signed_at timestamptz not null default now(),
  primary key (id),
  check (sign_method in ('PAD','CERT'))
);
comment on table act101.signature is 'ลายมือชื่ออิเล็กทรอนิกส์ — One row per electronic signature captured by the shared signature modal (pages 06,07,08,13,14,15,22).';
create index on act101.signature (case_id, step_code);

create table act101.attachment (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(50),
  doc_type varchar(100) not null,
  file_name text not null,
  storage_key text,
  mime_type varchar(100),
  size_bytes bigint,
  uploaded_by varchar(50),
  uploaded_at timestamptz not null default now(),
  primary key (id)
);
comment on table act101.attachment is 'เอกสารแนบ — Every file reference across the flow, including uploads the mockup collects but never saves (gap fix: now persisted).';
create index on act101.attachment (case_id, doc_type);

create table act101.document_number (
  id bigint generated always as identity,
  case_id bigint not null,
  doc_type varchar(50) not null,
  number_type varchar(10) not null,
  doc_no varchar(100) not null,
  doc_date date,
  issued_by varchar(200),
  issued_at timestamptz not null default now(),
  primary key (id),
  check (number_type in ('INTERNAL','EXTERNAL','REGISTRY'))
);
comment on table act101.document_number is 'เลขหนังสือ — Every ออกเลขหนังสือ event: internal receive/dispatch numbers and the external prosecutor letter number.';
create index on act101.document_number (case_id, doc_type);

create table act101.offense_law (
  code varchar(50),
  label_th text not null,
  primary key (code)
);
comment on table act101.offense_law is 'ประเภทกฎหมายฐานความผิด — Fixed options for the law dropdown on the offense-basis repeating widget.';

create table act101.prosecutor_case_type (
  code varchar(5),
  label_th text not null,
  primary key (code)
);
comment on table act101.prosecutor_case_type is 'กรณีความเห็น/คำสั่งพนักงานอัยการ — 9 fixed options (1-9) for the incoming prosecutor decision type.';

create table act101.prosecutor_level (
  code varchar(5),
  label_th text not null,
  primary key (code)
);
comment on table act101.prosecutor_level is 'ระดับศาล — Options for court level (0/1/2/3/9).';

create table act101.opinion_type (
  code varchar(10),
  label_th text not null,
  primary key (code)
);
comment on table act101.opinion_type is 'ประเภทความเห็น — Gap fix: explicit AGREE/DISSENT/OTHER code, since the mockup only stores the rendered Thai phrase and the routing on page 18/19 relies on a fragile substring check of that phrase.';

create table act101.review_decision (
  code varchar(10),
  label_th text not null,
  primary key (code)
);
comment on table act101.review_decision is 'ผลการตรวจ/พิจารณา — Shared APPROVE/RETURN decision code reused by pages 07, 08, 14, 15.';

create table act101.oag_verdict_case_type (
  code varchar(5),
  label_th text not null,
  outcome_code varchar(20),
  primary key (code)
);
comment on table act101.oag_verdict_case_type is 'กรณีคำวินิจฉัยชี้ขาดของ อสส. — The 9 fixed OAG verdict types, each mapped to whether it means prosecute or not-prosecute (per design-brief requirement).';

create table act101.oag_verdict_decision (
  code varchar(20),
  label_th text not null,
  primary key (code)
);
comment on table act101.oag_verdict_decision is 'ผลคำวินิจฉัยชี้ขาด อสส. — Binary outcome of an OAG verdict.';

create table act101.prosecutor_result_type (
  code varchar(20),
  label_th text not null,
  primary key (code)
);
comment on table act101.prosecutor_result_type is 'ผลคำพิพากษา/ผลการดำเนินคดีของอัยการ — Options for the optional final court/prosecution outcome captured on page 22.';

create table act101.physical_doc_intake (
  case_id bigint,
  board_admin_officer varchar(200),
  scanned_status varchar(20) default 'scanned',
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act101.physical_doc_intake is 'การรับเอกสารจากสารบรรณกลาง — 1:1 extra fields captured by savePhysicalDocIntake on page 02, beyond what already lives on case_file.';

create table act101.offense_basis (
  id bigint generated always as identity,
  case_id bigint not null,
  round_no int not null default 0,
  law_code varchar(50),
  law_other_text text,
  section varchar(50),
  basis text,
  sort_order int not null default 0,
  primary key (id)
);
comment on table act101.offense_basis is 'ฐานความผิด (มาตรา) — One-to-many offense law/section rows, editable on page 02 (intake) and re-editable on 06 (officer); round_no ties a row set to a specific opinion_draft_version (round_no=0 means the original intake set from page 02).';
create index on act101.offense_basis (case_id, round_no);

create table act101.assignment (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(30) not null,
  target_name text,
  target_role varchar(50),
  notes text,
  deadline_date date,
  assigned_by_name varchar(200),
  forwarded_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, step_code),
  check (step_code in ('DIRECTOR','GROUP_DIRECTOR'))
);
comment on table act101.assignment is 'การมอบหมายงาน — 1:N per step (DIRECTOR on page 04, GROUP_DIRECTOR on page 05) — director assigns to group director, group director assigns to legal officer.';
create index on act101.assignment (case_id);

create table act101.opinion_draft_version (
  id bigint generated always as identity,
  case_id bigint not null,
  version_no int not null,
  opinion_type_code varchar(10) not null,
  opinion_type_text text,
  opinion_other_specify text,
  legal_opinion_draft text,
  submitted_by_name varchar(200),
  signature_id bigint,
  submitted_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, version_no),
  check (version_no >= 1)
);
comment on table act101.opinion_draft_version is 'ร่างความเห็นทางกฎหมาย (แต่ละรอบ) — Gap fix: page 06 overwrites legalOpinionDraft/opinionType on every revision (send-back from 07 or 08); versioned here so history is kept, paired with case_transition rows for the send-back action.';
create index on act101.opinion_draft_version (case_id);

create table act101.opinion_review (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(30) not null,
  round_no int not null,
  decision_code varchar(10) not null,
  notes text,
  forward_target_name text,
  reviewer_name varchar(200),
  signature_id bigint,
  decided_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, step_code, round_no),
  check (round_no >= 1)
);
comment on table act101.opinion_review is 'การตรวจพิจารณาความเห็น — Merges page 07 (group director review) and page 08 (legal director approval); round_no matches the opinion_draft_version being reviewed so each send-back round keeps its own decision history.';
create index on act101.opinion_review (case_id, step_code);

create table act101.admin_dispatch (
  id bigint generated always as identity,
  case_id bigint not null,
  round_no int not null,
  dispatch_no varchar(50),
  dispatch_date date,
  target_name text,
  notes text,
  officer_name varchar(200),
  submitted_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, round_no),
  check (round_no in (1,2))
);
comment on table act101.admin_dispatch is 'ธุรการออกเลขส่งภายในเสนอผู้บริหาร — Merges page 09 (round 1, internal cover letter before exec sign round 1) and page 16 (round 2, before exec sign round 2).';
create index on act101.admin_dispatch (case_id);

create table act101.resolution_order (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(30) not null,
  target_name text,
  notes text,
  order_text text,
  actor_name varchar(200),
  acted_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, step_code),
  check (step_code in ('ADMIN_INTAKE','DIRECTOR','GROUP_DIRECTOR'))
);
comment on table act101.resolution_order is 'การสั่งการตามผลมติ — Merges page 10 (admin intake of the board resolution), page 11 (director order) and page 12 (group director order), the three sequential hand-offs after executive round 1.';
create index on act101.resolution_order (case_id);

create table act101.final_opinion_doc (
  case_id bigint,
  opinion_type_code varchar(10) not null,
  opinion_other_specify text,
  subject text,
  official_doc_heading text,
  summary text,
  required_copies smallint default 1,
  notes text,
  signature_id bigint,
  submitted_at timestamptz not null default now(),
  primary key (case_id)
);
comment on table act101.final_opinion_doc is 'หนังสือความเห็นตามมติ (ฉบับสมบูรณ์) — 1:1, page 13: the final opinion letter the officer drafts after the board resolution is processed. finalDocNo is a hard-coded constant in the mockup (gap #8), still modelled as a real field/document_number row.';

create table act101.final_doc_review (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(30) not null,
  action_text text,
  notes text,
  signature_id bigint,
  reviewed_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, step_code),
  check (step_code in ('GROUP_FINAL','DIRECTOR_FINAL'))
);
comment on table act101.final_doc_review is 'การตรวจหนังสือความเห็นฉบับสมบูรณ์ — Merges page 14 (group director review) and page 15 (legal director review). Both always forward regardless of the RETURN choice in the mockup (gap #2); decision text is still captured for audit.';
create index on act101.final_doc_review (case_id);

create table act101.admin_signed_receive (
  case_id bigint,
  external_dispatch_no varchar(100),
  external_dispatch_date date,
  signed_president_name text,
  signed_doc_file_attachment_id bigint,
  verification_notes text,
  dispatch_target text,
  verified_at timestamptz not null default now(),
  primary key (case_id)
);
comment on table act101.admin_signed_receive is 'การตรวจรับหนังสือลงนามและเลขส่งภายนอก — 1:1, page 17: admin verifies the executive-signed document and issues the external outgoing number (hard-coded constant in the mockup, still modelled here per brief).';

create table act101.dispatch_recipient (
  id bigint generated always as identity,
  case_id bigint not null,
  recipient_key varchar(20) not null,
  recipient_name text,
  method varchar(20) not null,
  tracking_no varchar(20),
  sent_date date,
  post_office text,
  sent_time time,
  receive_doc_no varchar(100),
  receiver_name text,
  location text,
  notes text,
  saved_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, recipient_key),
  check (recipient_key in ('oag','prosecutor')),
  check (method in ('postal_ems','hand_delivery'))
);
comment on table act101.dispatch_recipient is 'การจัดส่งหนังสือรายหน่วยงาน — One-to-many, page 18: one row per recipient (OAG and/or origin prosecutor), each dispatched by EMS or hand delivery. Gap fix: EMS receipt / hand-receipt scan files are now captured via attachment (link by case_id+step_code=EXTERNAL_DISPATCH+recipient_key).';
create index on act101.dispatch_recipient (case_id);

create table act101.oag_verdict_intake (
  case_id bigint,
  verdict_no varchar(100),
  verdict_date date,
  receive_date date,
  case_type_code varchar(5),
  case_type_other_text text,
  decision_code varchar(20),
  summary text,
  notes text,
  received_at timestamptz not null default now(),
  primary key (case_id)
);
comment on table act101.oag_verdict_intake is 'การรับผลคำวินิจฉัยชี้ขาด อสส. — 1:1, page 19: admin records the OAG''s ruling letter. Gap fix: the actual uploaded verdict PDF (in_oagVerdictFile) is now captured via attachment (the mockup only kept an autofill label as the name).';

create table act101.oag_verdict_review (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(30) not null,
  target_name text,
  notes text,
  review_date date,
  actor_name varchar(200),
  reviewed_at timestamptz not null default now(),
  primary key (id),
  unique (case_id, step_code),
  check (step_code in ('DIRECTOR','GROUP_DIRECTOR'))
);
comment on table act101.oag_verdict_review is 'การตรวจสอบคำวินิจฉัยและมอบหมาย — Merges page 20 (director review) and page 21 (group director review + reassignment) after OAG verdict intake.';
create index on act101.oag_verdict_review (case_id);

create table act101.case_closure (
  case_id bigint,
  officer_notes text,
  notify_doc_no varchar(100),
  notify_date date,
  notify_subject text,
  notify_target text default 'กองบริหารคดี (กบค.)',
  notify_file_attachment_id bigint,
  resolution_summary text,
  prosecutor_result_type_code varchar(20),
  prosecutor_result_other_text text,
  prosecutor_result_no varchar(100),
  prosecutor_result_date date,
  prosecutor_result_receive_date date,
  prosecutor_result_summary text,
  prosecutor_result_file_attachment_id bigint,
  signature_id bigint,
  closed_at timestamptz not null default now(),
  primary key (case_id)
);
comment on table act101.case_closure is 'การปิดคดีและแจ้งผล — 1:1, page 22: final closing notification to กองบริหารคดี, plus the optional prosecutor-result section. Gap fix: all prosecutorResult* fields and in_notifySubject were collected but dropped by the engine''s whitelist; now persisted.';

create table act101.tbl_law1_board_link (
  lb1_id bigint generated always as identity,
  lb1_case_id bigint not null,
  lb1_dispatch_id bigint,
  lb1_send_point varchar(10) not null,
  lb1_round_no smallint not null default 1,
  lb1_send_step_code varchar(10) not null,
  lb1_receive_step_code varchar(10),
  lb1_tbs_id bigint not null,
  lb1_submission_no varchar(50),
  lb1_matter_type varchar(3) not null,
  created_datetime timestamptz not null default now(),
  created_by integer,
  updated_datetime timestamptz,
  updated_by integer,
  primary key (lb1_id),
  unique (lb1_tbs_id),
  unique (lb1_case_id, lb1_send_point, lb1_round_no),
  check (lb1_send_point in ('S101-1', 'S101-2')),
  check (lb1_round_no >= 1)
);
comment on table act101.tbl_law1_board_link is 'การส่งเรื่องเข้ากิจกรรมที่ 7 (เชื่อม tbl_board_submission) — One row per submission from this sub-activity to กิจกรรมที่ 7; the resolution itself is read from tbl_board_submission.';
create index on act101.tbl_law1_board_link (lb1_case_id);

-- act101: tbl_board_submission is owned by another module (reference only, not created here)

alter table act101.case_file add constraint fk_case_file_prosecutor_case_type_code foreign key (prosecutor_case_type_code) references act101.prosecutor_case_type (code);
alter table act101.case_file add constraint fk_case_file_prosecutor_level_code foreign key (prosecutor_level_code) references act101.prosecutor_level (code);
alter table act101.case_file add constraint fk_case_file_status_code foreign key (status_code) references act101.status (code);
alter table act101.case_transition add constraint fk_case_transition_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.case_transition add constraint fk_case_transition_from_status_code foreign key (from_status_code) references act101.status (code);
alter table act101.case_transition add constraint fk_case_transition_to_status_code foreign key (to_status_code) references act101.status (code);
alter table act101.signature add constraint fk_signature_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.attachment add constraint fk_attachment_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.document_number add constraint fk_document_number_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.oag_verdict_case_type add constraint fk_oag_verdict_case_type_outcome_code foreign key (outcome_code) references act101.oag_verdict_decision (code);
alter table act101.physical_doc_intake add constraint fk_physical_doc_intake_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.offense_basis add constraint fk_offense_basis_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.offense_basis add constraint fk_offense_basis_law_code foreign key (law_code) references act101.offense_law (code);
alter table act101.assignment add constraint fk_assignment_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.opinion_draft_version add constraint fk_opinion_draft_version_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.opinion_draft_version add constraint fk_opinion_draft_version_opinion_type_code foreign key (opinion_type_code) references act101.opinion_type (code);
alter table act101.opinion_draft_version add constraint fk_opinion_draft_version_signature_id foreign key (signature_id) references act101.signature (id);
alter table act101.opinion_review add constraint fk_opinion_review_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.opinion_review add constraint fk_opinion_review_decision_code foreign key (decision_code) references act101.review_decision (code);
alter table act101.opinion_review add constraint fk_opinion_review_signature_id foreign key (signature_id) references act101.signature (id);
alter table act101.admin_dispatch add constraint fk_admin_dispatch_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.resolution_order add constraint fk_resolution_order_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.final_opinion_doc add constraint fk_final_opinion_doc_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.final_opinion_doc add constraint fk_final_opinion_doc_opinion_type_code foreign key (opinion_type_code) references act101.opinion_type (code);
alter table act101.final_opinion_doc add constraint fk_final_opinion_doc_signature_id foreign key (signature_id) references act101.signature (id);
alter table act101.final_doc_review add constraint fk_final_doc_review_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.final_doc_review add constraint fk_final_doc_review_signature_id foreign key (signature_id) references act101.signature (id);
alter table act101.admin_signed_receive add constraint fk_admin_signed_receive_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.admin_signed_receive add constraint fk_admin_signed_receive_signed_doc_file_attachment_id foreign key (signed_doc_file_attachment_id) references act101.attachment (id);
alter table act101.dispatch_recipient add constraint fk_dispatch_recipient_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.oag_verdict_intake add constraint fk_oag_verdict_intake_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.oag_verdict_intake add constraint fk_oag_verdict_intake_case_type_code foreign key (case_type_code) references act101.oag_verdict_case_type (code);
alter table act101.oag_verdict_intake add constraint fk_oag_verdict_intake_decision_code foreign key (decision_code) references act101.oag_verdict_decision (code);
alter table act101.oag_verdict_review add constraint fk_oag_verdict_review_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.case_closure add constraint fk_case_closure_case_id foreign key (case_id) references act101.case_file (id);
alter table act101.case_closure add constraint fk_case_closure_notify_file_attachment_id foreign key (notify_file_attachment_id) references act101.attachment (id);
alter table act101.case_closure add constraint fk_case_closure_prosecutor_result_type_code foreign key (prosecutor_result_type_code) references act101.prosecutor_result_type (code);
alter table act101.case_closure add constraint fk_case_closure_prosecutor_result_file_attachment_id foreign key (prosecutor_result_file_attachment_id) references act101.attachment (id);
alter table act101.case_closure add constraint fk_case_closure_signature_id foreign key (signature_id) references act101.signature (id);
alter table act101.tbl_law1_board_link add constraint fk_tbl_law1_board_link_lb1_case_id foreign key (lb1_case_id) references act101.case_file (id);
alter table act101.tbl_law1_board_link add constraint fk_tbl_law1_board_link_lb1_dispatch_id foreign key (lb1_dispatch_id) references act101.admin_dispatch (id);

-- seed act101.status
insert into act101.status (code, label_th, page, role) values ('PENDING_BOARD_INTAKE', 'รอธุรการรับเรื่อง', '02-board-intake.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DIRECTOR', 'ผอ.กองกฎหมายพิจารณา', '04-legal-director-review.html', 'dir_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_GROUP_DIRECTOR', 'ผอ.กลุ่มงานความเห็นแย้งพิจารณา', '05-group-director-review.html', 'group_director') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('DRAFTING_OPINION', 'นิติกรจัดทำความเห็น', '06-officer-opinion.html', 'legal_officer') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_GROUP_REVIEW', 'เสนอ ผอ.กลุ่มงานตรวจร่างความเห็น', '07-group-director-approval.html', 'group_director') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DIRECTOR_APPROVAL', 'เสนอ ผอ.กองกฎหมายพิจารณาความเห็น', '08-legal-director-approval.html', 'dir_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DISPATCH', 'ธุรการออกเลขส่งและส่งต่อผู้บริหาร', '09-legal-admin-dispatch.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DEPUTY_SG', 'เสนอผู้บริหารลงนามหนังสือความเห็น', '01-work-inbox.html', 'deputy_sg') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('RETURNED_FROM_EXEC', 'ธุรการรับผลมติ', '10-legal-admin-resolution.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_FINAL_DISPATCH', 'ธุรการรับผลมติ', '10-legal-admin-resolution.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DIRECTOR_RESOLUTION', 'เสนอผลมติ ผอ.กองกฎหมาย', '11-legal-director-resolution.html', 'dir_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DIRECTOR_RESOLUTION_ORDER', 'เสนอผลมติ ผอ.กองกฎหมาย', '11-legal-director-resolution.html', 'dir_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_GROUP_RESOLUTION', 'ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ', '12-group-director-resolution.html', 'group_director') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_GROUP_DIRECTOR_RESOLUTION_ORDER', 'ผอ.กลุ่มงานความเห็นแย้งพิจารณาผลมติ', '12-group-director-resolution.html', 'group_director') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_OFFICER_FINAL_DOC', 'นิติกรจัดทำหนังสือความเห็นตามมติ', '13-officer-final-doc.html', 'legal_officer') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_GROUP_FINAL_REVIEW', 'ผอ.กลุ่มงานตรวจหนังสือความเห็น', '14-group-director-final-review.html', 'group_director') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DIRECTOR_FINAL_REVIEW', 'ผอ.กองตรวจหนังสือความเห็น', '15-legal-director-final-review.html', 'dir_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_FINAL_DISPATCH_ROUND2', 'ธุรการออกเลขส่งเสนอผู้บริหาร', '16-legal-admin-final-dispatch.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('SUBMITTED_TO_EXEC_ROUND2', 'เสนอผู้บริหารลงนามหนังสือความเห็น', '01-work-inbox.html', 'deputy_sg') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_ADMIN_SIGNED_RECEIVE', 'ผู้บริหารลงนามแล้ว (รอธุรการตรวจรับ)', '17-legal-admin-external-dispatch-receive.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_OFFICER_EXTERNAL_DISPATCH', 'นิติกรรับเรื่องหนังสือลงนามแล้ว', '18-officer-external-dispatch.html', 'legal_officer') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_OFFICER_FINAL_ACTION', 'นิติกรจัดส่งหนังสือ', '18-officer-external-dispatch.html', 'legal_officer') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('DISPATCHED_TO_PROSECUTOR', 'จัดส่งครบทุกหน่วยงานแล้ว', '18-officer-external-dispatch.html', 'legal_officer') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_ADMIN_OAG_VERDICT_INTAKE', 'รอธุรการรับผลคำวินิจฉัย อสส.', '19-legal-admin-oag-verdict-intake.html', 'admin_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_DIRECTOR_OAG_VERDICT_REVIEW', 'เสนอ ผอ.กอง ตรวจสอบคำวินิจฉัย อสส.', '20-legal-director-oag-verdict-review.html', 'dir_legal') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_GROUP_OAG_VERDICT_REVIEW', 'เสนอ ผอ.กลุ่มงาน มอบหมายนิติกรบันทึกผล', '21-group-director-oag-verdict-review.html', 'group_director') on conflict do nothing;
insert into act101.status (code, label_th, page, role) values ('PENDING_OFFICER_FINAL_NOTIFICATION', 'รอนิติกรบันทึกผล และแจ้งกองบริหารคดี', '22-officer-case-closed-notify.html', 'legal_officer') on conflict do nothing;
insert into act101.status (code, label_th, page, role, is_terminal) values ('COMPLETED_OAG_RESOLVED', 'เสร็จสิ้นกระบวนงาน (คำวินิจฉัย อสส. ชี้ขาด)', null, null, true) on conflict do nothing;

-- seed act101.offense_law
insert into act101.offense_law (code, label_th) values ('PENAL_CODE', 'ประมวลกฎหมายอาญา') on conflict do nothing;
insert into act101.offense_law (code, label_th) values ('BIDDING_ACT', 'พ.ร.บ.ว่าด้วยความผิดเกี่ยวกับการเสนอราคาต่อหน่วยงานของรัฐ พ.ศ. 2542') on conflict do nothing;
insert into act101.offense_law (code, label_th) values ('PACC_ORGANIC_ACT', 'พ.ร.ป.ว่าด้วยการป้องกันและปราบปรามการทุจริต') on conflict do nothing;
insert into act101.offense_law (code, label_th) values ('OTHER', 'อื่นๆ') on conflict do nothing;

-- seed act101.prosecutor_case_type
insert into act101.prosecutor_case_type (code, label_th) values ('1', 'อัยการมีความเห็นสั่งไม่ฟ้อง') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('2', 'อัยการมีความเห็นสั่งถอนฟ้อง') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('3', 'อัยการมีความเห็นสั่งไม่อุทธรณ์ (ลงโทษ)') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('4', 'อัยการมีความเห็นสั่งไม่อุทธรณ์ (ยกฟ้อง)') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('5', 'อัยการมีความเห็นสั่งถอนอุทธรณ์') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('6', 'อัยการมีความเห็นสั่งไม่ฎีกา (ลงโทษ)') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('7', 'อัยการมีความเห็นสั่งไม่ฎีกา (ยกฟ้อง)') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('8', 'อัยการมีความเห็นสั่งถอนฎีกา') on conflict do nothing;
insert into act101.prosecutor_case_type (code, label_th) values ('9', 'อื่นๆ') on conflict do nothing;

-- seed act101.prosecutor_level
insert into act101.prosecutor_level (code, label_th) values ('0', 'ยังไม่มีศาลระบุ') on conflict do nothing;
insert into act101.prosecutor_level (code, label_th) values ('1', 'ศาลชั้นต้น') on conflict do nothing;
insert into act101.prosecutor_level (code, label_th) values ('2', 'ศาลอุทธรณ์') on conflict do nothing;
insert into act101.prosecutor_level (code, label_th) values ('3', 'ศาลฎีกา') on conflict do nothing;
insert into act101.prosecutor_level (code, label_th) values ('9', 'อื่นๆ') on conflict do nothing;

-- seed act101.opinion_type
insert into act101.opinion_type (code, label_th) values ('AGREE', 'เห็นชอบตามคำสั่ง/คำวินิจฉัยของพนักงานอัยการ') on conflict do nothing;
insert into act101.opinion_type (code, label_th) values ('DISSENT', 'เสนอ/เห็นควรทำความเห็นแย้งคำสั่ง/คำวินิจฉัยของพนักงานอัยการ') on conflict do nothing;
insert into act101.opinion_type (code, label_th) values ('OTHER', 'ความเห็นอื่นๆ') on conflict do nothing;

-- seed act101.review_decision
insert into act101.review_decision (code, label_th) values ('APPROVE', 'เห็นชอบ') on conflict do nothing;
insert into act101.review_decision (code, label_th) values ('RETURN', 'ไม่เห็นชอบ / ส่งกลับแก้ไข') on conflict do nothing;

-- seed act101.oag_verdict_case_type
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('1', 'อสส. ชี้ขาดให้ฟ้องคดี', 'PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('2', 'อสส. ชี้ขาดยืนตามคำสั่งไม่ฟ้อง', 'NON_PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('3', 'อสส. ชี้ขาดไม่ให้ถอนฟ้อง (ให้ดำเนินคดีต่อ)', 'PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('4', 'อสส. ชี้ขาดยืนตามการถอนฟ้อง', 'NON_PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('5', 'อสส. ชี้ขาดให้อุทธรณ์', 'PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('6', 'อสส. ชี้ขาดยืนตามคำสั่งไม่อุทธรณ์/ถอนอุทธรณ์', 'NON_PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('7', 'อสส. ชี้ขาดให้ฎีกา', 'PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('8', 'อสส. ชี้ขาดยืนตามคำสั่งไม่ฎีกา/ถอนฎีกา', 'NON_PROSECUTE') on conflict do nothing;
insert into act101.oag_verdict_case_type (code, label_th, outcome_code) values ('9', 'อื่นๆ', null) on conflict do nothing;

-- seed act101.oag_verdict_decision
insert into act101.oag_verdict_decision (code, label_th) values ('PROSECUTE', 'อสส. ชี้ขาดให้ฟ้องคดี') on conflict do nothing;
insert into act101.oag_verdict_decision (code, label_th) values ('NON_PROSECUTE', 'อสส. ชี้ขาดไม่ฟ้อง/ยุติคดี') on conflict do nothing;

-- seed act101.prosecutor_result_type
insert into act101.prosecutor_result_type (code, label_th) values ('PROSECUTED', 'ฟ้องคดีต่อศาลแล้ว') on conflict do nothing;
insert into act101.prosecutor_result_type (code, label_th) values ('CONVICTED', 'ศาลพิพากษาลงโทษ') on conflict do nothing;
insert into act101.prosecutor_result_type (code, label_th) values ('ACQUITTED', 'ศาลพิพากษายกฟ้อง') on conflict do nothing;
insert into act101.prosecutor_result_type (code, label_th) values ('DROPPED', 'ยุติการดำเนินคดี') on conflict do nothing;
insert into act101.prosecutor_result_type (code, label_th) values ('OTHER', 'อื่นๆ') on conflict do nothing;

-- ===== 10.2 การขอเปิดเผยข้อมูลข่าวสาร
create schema if not exists act102;

create table act102.status (
  code varchar(50),
  label_th varchar(200) not null,
  step_code varchar(50),
  seq int,
  page varchar(120),
  role varchar(50),
  is_terminal boolean not null default false,
  primary key (code)
);
comment on table act102.status is 'สถานะคำร้อง — lookup of every case/appeal statusCode used by the flow';

create table act102.case_file (
  id bigint generated always as identity,
  case_no varchar(50) not null unique,
  pacc_case_no varchar(100),
  category varchar(20) not null,
  category_name varchar(100),
  status_code varchar(50) not null,
  status_label varchar(200),
  status_badge varchar(50),
  assigned_role varchar(50),
  officer_name varchar(200),
  l2_step varchar(50),
  l2_step_seq int,
  workflow_step int,
  law_receive_no varchar(50),
  central_saraban_no varchar(50),
  physical_doc_date date,
  board_admin_officer varchar(200),
  scanned_doc_file varchar(300),
  scanned_status varchar(30),
  accuser varchar(300),
  accused varchar(300),
  requester_name varchar(200) not null,
  requester_type_code varchar(20),
  requester_type_name varchar(200),
  title text not null,
  requested_info text not null,
  related_case_no varchar(100),
  request_channel_code varchar(20),
  request_channel_name varchar(200),
  request_channel_region int,
  request_received_date date,
  approval_branch varchar(10),
  l2_case_state_code varchar(20),
  l2_case_state_name varchar(200),
  l2_resolution_type_code varchar(20),
  l2_resolution_type_name varchar(200),
  l2_resolution_other_detail text,
  l2_resolution_detail text,
  l2_committee_opinion text,
  l2_redaction_notes text,
  l2_redaction_done boolean,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_no)
);
comment on table act102.case_file is 'แฟ้มคำร้องขอเปิดเผยข้อมูลข่าวสาร — one row per disclosure-request case; holds current state and all 1:1 intake/business fields';
create index on act102.case_file (status_code);
create index on act102.case_file (assigned_role);

create table act102.case_transition (
  id bigint generated always as identity,
  case_id bigint not null,
  from_status_code varchar(50),
  to_status_code varchar(50) not null,
  action varchar(20) not null,
  decision_code varchar(50),
  note text,
  actor_user_id varchar(50),
  actor_name varchar(200),
  actor_role varchar(50),
  acted_at timestamptz not null default now(),
  primary key (id)
);
comment on table act102.case_transition is 'ประวัติการเปลี่ยนสถานะ — append-only history of every submit/return/branch action on a case, preserving send-back rounds';
create index on act102.case_transition (case_id, acted_at);

create table act102.resolution (
  id bigint generated always as identity,
  case_id bigint not null,
  round_no int not null,
  stage_code varchar(30) not null,
  resolution_type_code varchar(20) not null,
  resolution_type_name varchar(200),
  resolution_other_detail text,
  case_state_code varchar(20) not null,
  case_state_name varchar(200),
  committee_opinion text,
  resolution_detail text,
  opinion_text text,
  skip_secgen boolean,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, round_no),
  check (round_no >= 1)
);
comment on table act102.resolution is 'มติ/สถานะคดี (ประวัติแต่ละรอบ) — one row per resolution round so the preliminary subcommittee resolution and later deputy-SG/secretary-general final resolution do not overwrite each other';
create index on act102.resolution (case_id);

create table act102.document_number (
  id bigint generated always as identity,
  case_id bigint,
  appeal_id bigint,
  doc_type varchar(50) not null,
  number_type varchar(20) not null,
  doc_no varchar(100) not null,
  doc_date date,
  issued_by varchar(200),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id)
);
comment on table act102.document_number is 'เลขที่หนังสือ/เอกสาร — every issued document number and date (internal memo, deny/close/committee memo, dispatches, notice, appeal doc numbers)';
create index on act102.document_number (case_id);
create index on act102.document_number (appeal_id);
create index on act102.document_number (doc_type);

create table act102.signature (
  id bigint generated always as identity,
  case_id bigint,
  appeal_id bigint,
  step_code varchar(50) not null,
  signer_role varchar(50),
  signer_name varchar(200),
  position_text varchar(200),
  sign_method varchar(10),
  cert_id varchar(50),
  image_data text,
  opinion_text text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, appeal_id, step_code)
);
comment on table act102.signature is 'ลายเซ็น — one row per signed slot (l2Signatures map -> rows), for both the base case and appeal steps';
create index on act102.signature (case_id);
create index on act102.signature (appeal_id);

create table act102.attachment (
  id bigint generated always as identity,
  case_id bigint,
  appeal_id bigint,
  step_code varchar(50) not null,
  doc_type varchar(50),
  file_name varchar(300) not null,
  storage_key varchar(300),
  mime_type varchar(100),
  size_bytes bigint,
  uploaded_user_id varchar(50),
  uploaded_name varchar(200),
  uploaded_role varchar(50),
  uploaded_at timestamptz not null default now(),
  primary key (id)
);
comment on table act102.attachment is 'ไฟล์แนบ — every uploaded file name across the flow (binary content is never stored in the mockup)';
create index on act102.attachment (case_id, step_code);
create index on act102.attachment (appeal_id, step_code);

create table act102.director_assign (
  case_id bigint,
  assign_target_name varchar(200) not null,
  order_date date not null,
  order_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.director_assign is 'มอบหมายโดย ผอ.กองกฎหมาย — 1:1 fields from 10-2-01 legal-director-assign';

create table act102.group_assign (
  case_id bigint,
  legal_issues text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.group_assign is 'มอบหมายโดยผู้อำนวยการกลุ่ม — 1:1 fields from 10-2-02 group-director-assign';

create table act102.secretariat_opinion (
  case_id bigint,
  opinion_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.secretariat_opinion is 'ความเห็นฝ่ายเลขานุการ — 1:1 fields from 10-2-03 secretariat-opinion';

create table act102.group_verify (
  id bigint generated always as identity,
  case_id bigint not null,
  round_no int not null,
  verify_result varchar(20) not null,
  verify_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, round_no),
  check (verify_result in ('COMPLETE','REVISE')),
  check (round_no >= 1)
);
comment on table act102.group_verify is 'ผลการตรวจสอบของผู้อำนวยการกลุ่ม (ตามรอบ) — round history for 10-2-04 group-director-verify, since a REVISE result sends the case back to 10-2-03 and the page can be revisited';
create index on act102.group_verify (case_id);

create table act102.meeting (
  case_id bigint,
  meeting_no varchar(50) not null,
  meeting_date date not null,
  meeting_venue varchar(300) not null,
  agenda_no varchar(50) not null,
  agenda_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.meeting is 'การประชุมคณะอนุกรรมการกลั่นกรอง — 1:1 subcommittee meeting/agenda fields set at 10-2-05 and read back at 10-2-06/07';

create table act102.precomment (
  case_id bigint,
  admin_comment text,
  dirlegal_comment text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.precomment is 'ความเห็นก่อนจัดทำหนังสือเสนอ — 1:1 admin/director pre-comments from 10-2-33 and 10-2-34, inserted before the resolution document is drafted';

create table act102.resolution_memo (
  case_id bigint,
  division_name varchar(200) not null,
  division_phone varchar(50) not null,
  doc_date date not null,
  addressed_to varchar(300) not null,
  subject varchar(300) not null,
  data_owner varchar(200),
  resolution_facts text not null,
  background text not null,
  facts text not null,
  legal_basis text not null,
  considerations text not null,
  dir_legal_opinion text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.resolution_memo is 'บันทึกเสนอเลขาธิการฯ (หนังสือหลัก) — 1:1 body of the main proposal memo drafted at 10-2-07 and opined on at 10-2-08; doc number lives in document_number';

create table act102.dispatch (
  case_id bigint,
  dispatch_target varchar(300),
  dispatch_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.dispatch is 'การนำส่งหนังสือถึงรองเลขาธิการ/เลขาธิการ — 1:1 fields from 10-2-09 legal-admin-dispatch';

create table act102.deny_case (
  case_id bigint,
  division_name varchar(200),
  division_phone varchar(50),
  addressed_to varchar(300),
  deny_memo_text text not null,
  assign_dept varchar(300),
  assign_date date,
  assign_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.deny_case is 'สำนวนแจ้งมติไม่อนุญาตเปิดเผย — 1:1 fields for the DENY branch (10-2-15/16/17); doc number lives in document_number as DENY_MEMO';

create table act102.close_case (
  case_id bigint,
  division_name varchar(200),
  division_phone varchar(50),
  addressed_to varchar(300),
  close_memo_text text not null,
  assign_dept varchar(300),
  assign_date date,
  assign_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.close_case is 'สำนวนปิดคดี (อนุญาต/บางส่วน + คดีเสร็จสิ้น) — 1:1 fields for the CLOSE branch (10-2-22/23/24), taken when resolution is DISCLOSE/PARTIAL and case state is CLOSED; doc number lives in document_number as CLOSE_MEMO';

create table act102.committee_memo (
  id bigint generated always as identity,
  case_id bigint not null,
  round_no int not null,
  data_owner varchar(200),
  sheet_facts text,
  division_name varchar(200),
  division_phone varchar(50),
  meeting_venue varchar(300),
  addressed_to varchar(300),
  background text,
  legal_basis text,
  considerations text,
  resolution_text text,
  group_approve_opinion text,
  director_opinion text,
  send_back_reason text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, round_no),
  check (round_no >= 1)
);
comment on table act102.committee_memo is 'บันทึกเสนอคณะกรรมการ ป.ป.ท. (รอบ 2, ตามรอบ) — round history for 10-2-25/26/27, since a send-back from either the group director or the legal director resets the draft and re-runs the same 3 steps (source note: unsign + statusCode reset)';
create index on act102.committee_memo (case_id);

create table act102.committee_dispatch (
  case_id bigint,
  dispatch_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.committee_dispatch is 'นำส่งหนังสือถึงคณะกรรมการ ป.ป.ท. (รอบ 2) — 1:1 fields from 10-2-29; doc number lives in document_number as COMMITTEE_DISPATCH';

create table act102.tbl_law2_board_ack (
  ba2_case_id bigint,
  ba2_receive_notes text,
  ba2_dirlegal_ack_opinion text,
  ba2_groupdir_ack_opinion text,
  created_datetime timestamptz not null default now(),
  created_by integer,
  updated_datetime timestamptz,
  updated_by integer,
  primary key (ba2_case_id)
);
comment on table act102.tbl_law2_board_ack is 'การรับทราบมติคณะกรรมการ ป.ป.ท. (รอบ 2) — LAW-internal acknowledgement of the round-2 board resolution; the resolution itself is in tbl_board_submission.';

create table act102.notice (
  case_id bigint,
  division_name varchar(200),
  division_phone varchar(50),
  recipient varchar(200) not null,
  body_html text not null,
  appointment_date date,
  groupdir_opinion text,
  dispatch_date date,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act102.notice is 'หนังสือแจ้งมติต่อผู้ยื่นคำขอ — 1:1 fields covering 10-2-11 (draft), 10-2-37 (group director review), 10-2-13 (sign), 10-2-14 (dispatch); doc number lives in document_number as NOTICE';

create table act102.appeal (
  id bigint generated always as identity,
  case_id bigint not null,
  appeal_system_no varchar(50) not null unique,
  status_code varchar(50) not null,
  receive_no varchar(100) not null,
  receive_date date not null,
  channel_code varchar(20),
  channel_detail varchar(50),
  receive_notes text,
  summary text not null,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (appeal_system_no)
);
comment on table act102.appeal is 'คำอุทธรณ์ — one row per appeal against a DENY resolution; modelled as its own table (design decision, see notes) even though the mockup writes appeal fields onto the same request record';
create index on act102.appeal (case_id);
create index on act102.appeal (status_code);

create table act102.appeal_step (
  id bigint generated always as identity,
  appeal_id bigint not null,
  step_code varchar(50) not null,
  ref_no varchar(100),
  result_code varchar(50),
  result_label varchar(200),
  note_text text,
  channel_code varchar(20),
  channel_detail varchar(50),
  date_1 date,
  date_2 date,
  actor_user_id varchar(50),
  actor_name varchar(200),
  actor_role varchar(50),
  acted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (appeal_id, step_code)
);
comment on table act102.appeal_step is 'ขั้นตอนคำอุทธรณ์ (รายขั้นตอน) — one row per appeal step (appeal-02..13) holding that step notes/decision/dates; generalized instead of one table per page since each step is mostly a note plus 0-2 typed values';
create index on act102.appeal_step (appeal_id);

create table act102.resolution_type (
  code varchar(20),
  label_th varchar(200) not null,
  primary key (code)
);
comment on table act102.resolution_type is 'ประเภทมติ — RESOLUTION_TYPES enum from ecmis-10-2.js: DISCLOSE/PARTIAL/DENY/OTHER';

create table act102.case_state (
  code varchar(20),
  label_th varchar(200) not null,
  primary key (code)
);
comment on table act102.case_state is 'สถานะคดีที่เกี่ยวข้อง — CASE_STATES enum: CLOSED/INVESTIGATING';

create table act102.requester_type (
  code varchar(20),
  label_th varchar(200) not null,
  primary key (code)
);
comment on table act102.requester_type is 'ประเภทผู้ยื่นคำขอ — 02-board-intake in_requesterType options: CITIZEN/JURISTIC/AGENCY/OTHER';

create table act102.request_channel (
  code varchar(20),
  label_th varchar(200) not null,
  primary key (code)
);
comment on table act102.request_channel is 'ช่องทางการยื่นคำขอ — 02-board-intake in_requestChannel options: CENTRAL/REGION/POST/ELECTRONIC/OTHER';

create table act102.appeal_ruling_type (
  code varchar(20),
  label_th varchar(200) not null,
  primary key (code)
);
comment on table act102.appeal_ruling_type is 'ผลคำวินิจฉัยอุทธรณ์ — appeal-06/07 RULING_LABELS: UPHOLD/REVERSE_FULL/REVERSE_PARTIAL';

create table act102.appeal_board_resolution_type (
  code varchar(20),
  label_th varchar(200) not null,
  primary key (code)
);
comment on table act102.appeal_board_resolution_type is 'มติคณะกรรมการต่ออุทธรณ์ — BOARD_APPEAL_RESOLUTION_TYPES enum: DISCLOSE/PARTIAL/DENY';

create table act102.tbl_law2_board_link (
  lb2_id bigint generated always as identity,
  lb2_case_id bigint not null,
  lb2_appeal_id bigint,
  lb2_send_point varchar(10) not null,
  lb2_round_no smallint not null default 1,
  lb2_send_step_code varchar(10) not null,
  lb2_receive_step_code varchar(10),
  lb2_tbs_id bigint not null,
  lb2_submission_no varchar(50),
  lb2_matter_type varchar(3) not null,
  created_datetime timestamptz not null default now(),
  created_by integer,
  updated_datetime timestamptz,
  updated_by integer,
  primary key (lb2_id),
  unique (lb2_tbs_id),
  unique (lb2_case_id, lb2_send_point, lb2_round_no),
  check (lb2_send_point in ('S102-1', 'S102-2', 'S102-3')),
  check (lb2_round_no >= 1)
);
comment on table act102.tbl_law2_board_link is 'การส่งเรื่องเข้ากิจกรรมที่ 7 (เชื่อม tbl_board_submission) — One row per submission from this sub-activity to กิจกรรมที่ 7; the resolution itself is read from tbl_board_submission.';
create index on act102.tbl_law2_board_link (lb2_case_id);

-- act102: tbl_board_submission is owned by another module (reference only, not created here)

alter table act102.case_file add constraint fk_case_file_status_code foreign key (status_code) references act102.status (code);
alter table act102.case_file add constraint fk_case_file_requester_type_code foreign key (requester_type_code) references act102.requester_type (code);
alter table act102.case_file add constraint fk_case_file_request_channel_code foreign key (request_channel_code) references act102.request_channel (code);
alter table act102.case_file add constraint fk_case_file_l2_case_state_code foreign key (l2_case_state_code) references act102.case_state (code);
alter table act102.case_file add constraint fk_case_file_l2_resolution_type_code foreign key (l2_resolution_type_code) references act102.resolution_type (code);
alter table act102.case_transition add constraint fk_case_transition_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.case_transition add constraint fk_case_transition_from_status_code foreign key (from_status_code) references act102.status (code);
alter table act102.case_transition add constraint fk_case_transition_to_status_code foreign key (to_status_code) references act102.status (code);
alter table act102.resolution add constraint fk_resolution_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.resolution add constraint fk_resolution_resolution_type_code foreign key (resolution_type_code) references act102.resolution_type (code);
alter table act102.resolution add constraint fk_resolution_case_state_code foreign key (case_state_code) references act102.case_state (code);
alter table act102.document_number add constraint fk_document_number_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.document_number add constraint fk_document_number_appeal_id foreign key (appeal_id) references act102.appeal (id);
alter table act102.signature add constraint fk_signature_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.signature add constraint fk_signature_appeal_id foreign key (appeal_id) references act102.appeal (id);
alter table act102.attachment add constraint fk_attachment_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.attachment add constraint fk_attachment_appeal_id foreign key (appeal_id) references act102.appeal (id);
alter table act102.director_assign add constraint fk_director_assign_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.group_assign add constraint fk_group_assign_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.secretariat_opinion add constraint fk_secretariat_opinion_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.group_verify add constraint fk_group_verify_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.meeting add constraint fk_meeting_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.precomment add constraint fk_precomment_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.resolution_memo add constraint fk_resolution_memo_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.dispatch add constraint fk_dispatch_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.deny_case add constraint fk_deny_case_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.close_case add constraint fk_close_case_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.committee_memo add constraint fk_committee_memo_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.committee_dispatch add constraint fk_committee_dispatch_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.tbl_law2_board_ack add constraint fk_tbl_law2_board_ack_ba2_case_id foreign key (ba2_case_id) references act102.case_file (id);
alter table act102.notice add constraint fk_notice_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.appeal add constraint fk_appeal_case_id foreign key (case_id) references act102.case_file (id);
alter table act102.appeal add constraint fk_appeal_status_code foreign key (status_code) references act102.status (code);
alter table act102.appeal_step add constraint fk_appeal_step_appeal_id foreign key (appeal_id) references act102.appeal (id);
alter table act102.tbl_law2_board_link add constraint fk_tbl_law2_board_link_lb2_case_id foreign key (lb2_case_id) references act102.case_file (id);
alter table act102.tbl_law2_board_link add constraint fk_tbl_law2_board_link_lb2_appeal_id foreign key (lb2_appeal_id) references act102.appeal (id);

-- seed act102.status
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DIRECTOR_ASSIGN', 'ผอ.กองกฎหมายพิจารณาสั่งการ', 'LAW0037', '02-board-intake.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_GROUP_ASSIGN', 'ผอ.กลุ่มงานมอบหมายเจ้าหน้าที่', 'LAW0038', '10-2-01-legal-director-assign.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_SECRETARIAT_OPINION', 'ฝ่ายเลขานุการเสนอความเห็น', 'LAW0039', '10-2-02-group-director-assign.html', 'group_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_GROUP_VERIFY', 'ผอ.กลุ่มงานตรวจสอบความเห็น', 'LAW0040', '10-2-03-secretariat-opinion.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_AGENDA', 'ฝ่ายเลขานุการจัดวาระการประชุม', 'LAW0041', '10-2-04-group-director-verify.html', 'group_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_SUBCOMMITTEE', 'รอคณะอนุกรรมการกลั่นกรองพิจารณา', 'LAW0042-0043', '10-2-05-secretariat-agenda.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_RESOLUTION_DOC', 'รอจัดทำหนังสือแจ้งมติ', 'LAW0044', '10-2-06-subcommittee-resolution.html', 'subcommittee_screen', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DIRLEGAL_PRECOMMENT', 'ผอ.กองกฎหมายให้ความเห็นเบื้องต้น', 'L2-ADMIN-PRECOMMENT', '10-2-33-legal-admin-comment.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_SECRETARIAT_DRAFT', 'ฝ่ายเลขานุการจัดทำบันทึกเสนอ', 'L2-DIRLEGAL-PRECOMMENT', '10-2-34-legal-director-comment.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DIRLEGAL_OPINION', 'ผอ.กองกฎหมายให้ความเห็น', 'LAW0045-0046', '10-2-07-secretariat-resolution-doc.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DISPATCH', 'ธุรการกองกฎหมายนำส่งหนังสือ', 'LAW0045.1', '10-2-08-legal-director-propose.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DEPUTY_SG_OPINION', 'รองเลขาธิการฯ พิจารณาให้ความเห็นและลงนาม', 'L2-DISPATCH', '10-2-09-legal-admin-dispatch.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_DEPUTY_SG_RESOLVED', 'รองเลขาธิการฯ ลงมติแล้ว (ข้ามเลขาธิการ)', 'L2-DEPUTY-SG-OPINION', '10-2-32-deputy-sg-opinion-sign.html', 'deputy_sg', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_SECGEN_OPINION', 'เลขาธิการฯ พิจารณาให้ความเห็นและลงนาม', 'L2-DEPUTY-SG-OPINION', '10-2-32-deputy-sg-opinion-sign.html', 'secgen', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_SECGEN_RESOLVED', 'เลขาธิการฯ ลงมติแล้ว', 'L2-SECGEN-OPINION', '10-2-31-secgen-opinion-sign.html', 'secgen', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_NOTICE_DRAFT', 'ฝ่ายเลขานุการยกร่างหนังสือแจ้งมติ', 'L2-RECEIVE-OUTCOME', '10-2-10-legal-admin-receive-outcome.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DENY_MEMO', 'ฝ่ายเลขานุการจัดทำบันทึกแจ้งมติไม่อนุญาต', 'L2-DENY-MEMO', '10-2-15-secretariat-deny-memo.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DENY_PROPOSE', 'ผอ.กองกฎหมายเสนอเรื่อง (ไม่อนุญาต)', 'L2-DENY-PROPOSE', '10-2-16-legal-director-deny-propose.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DENY_DISPATCH_COMMITTEE', 'ธุรการนำส่งและมอบหมายกอง/สำนัก', 'L2-DENY-DISPATCH-COMMITTEE', '10-2-17-legal-admin-deny-dispatch-committee.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_CASE_CLOSED_DENY_ASSIGNED', 'คดีเสร็จสิ้น (ไม่อนุญาต, มอบหมายแล้ว)', 'L2-DENY-DISPATCH-COMMITTEE', '10-2-17-legal-admin-deny-dispatch-committee.html', 'admin_legal', true) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_CLOSE_MEMO', 'ฝ่ายเลขานุการจัดทำบันทึกแจ้งมติ (ปิดคดี)', 'L2-CLOSE-MEMO', '10-2-22-secretariat-close-memo.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_CLOSE_PROPOSE', 'ผอ.กองกฎหมายเสนอเรื่อง (ปิดคดี)', 'L2-CLOSE-PROPOSE', '10-2-23-legal-director-close-propose.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_CLOSE_DISPATCH_COMMITTEE', 'ธุรการนำส่งและมอบหมายกอง/สำนัก (ปิดคดี)', 'L2-CLOSE-DISPATCH-COMMITTEE', '10-2-24-legal-admin-close-dispatch.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_CASE_CLOSED_DISCLOSE_ASSIGNED', 'คดีเสร็จสิ้น (อนุญาต/บางส่วน, มอบหมายแล้ว)', 'L2-CLOSE-DISPATCH-COMMITTEE', '10-2-24-legal-admin-close-dispatch.html', 'admin_legal', true) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_COMMITTEE_MEMO_DRAFT', 'ฝ่ายเลขานุการยกร่างบันทึกเสนอคณะกรรมการ', 'L2-COMMITTEE-MEMO-DRAFT', '10-2-25-secretariat-committee-memo-draft.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_COMMITTEE_DIRECTOR_OPINION', 'ผอ.กลุ่มงานความเห็นแย้งพิจารณา', 'L2-COMMITTEE-GROUP-APPROVE', '10-2-27-group-director-committee-approve.html', 'group_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_COMMITTEE_DIRECTOR_OPINION_APPROVED', 'ผอ.กองกฎหมายให้ความเห็น (เสนอคณะกรรมการ)', 'L2-COMMITTEE-DIRECTOR-OPINION', '10-2-26-legal-director-committee-opinion.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_COMMITTEE_DISPATCH', 'ธุรการนำส่งหนังสือถึงคณะกรรมการ ป.ป.ท.', 'L2-COMMITTEE-DISPATCH', '10-2-29-legal-admin-committee-dispatch.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_READY_FOR_BOARD_ROUND2', 'รอคณะกรรมการ ป.ป.ท. พิจารณา (รอบ 2)', 'L2-COMMITTEE-DISPATCH', '10-2-30-legal-admin-receive-board-round2.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_BOARD_RESOLVED_ROUND2', 'คณะกรรมการ ป.ป.ท. มีมติแล้ว (รอบ 2, ตั้งค่าจากภายนอก)', 'L2-RECEIVE-BOARD-ROUND2', '10-2-30-legal-admin-receive-board-round2.html', 'admin_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_DIRLEGAL_BOARD_ACK', 'ผอ.กองกฎหมายรับทราบมติคณะกรรมการ', 'L2-BOARD-DIRLEGAL-ACK', '10-2-35-legal-director-board-ack.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_GROUPDIR_BOARD_ACK', 'ผอ.กลุ่มงานรับทราบมติคณะกรรมการ', 'L2-BOARD-GROUPDIR-ACK', '10-2-36-group-director-board-ack.html', 'group_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_NOTICE_GROUPDIR_REVIEW', 'ผอ.กลุ่มงานตรวจทานหนังสือแจ้งมติ', 'L2-NOTICE-DRAFT', '10-2-11-secretariat-disclose-partial-notice-draft.html', 'sub_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_NOTICE_SIGN', 'ผอ.กองกฎหมายลงนามหนังสือแจ้งมติ', 'L2-NOTICE-GROUPDIR-REVIEW', '10-2-37-group-director-notice-review.html', 'group_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_NOTICE_DISPATCH', 'ธุรการนำส่งหนังสือแจ้งมติ', 'L2-NOTICE-SIGN', '10-2-13-legal-director-disclose-partial-notice-sign.html', 'dir_legal', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_CASE_CLOSED_NOTICE_SENT', 'คดีเสร็จสิ้น (แจ้งมติแล้ว)', 'L2-NOTICE-DISPATCH', '10-2-14-legal-admin-disclose-partial-notice-dispatch.html', 'admin_legal', true) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_INTAKE', 'รอลงรับคำอุทธรณ์ (ตั้งค่าจากภายนอก)', 'L2-APPEAL-INTAKE', '10-2-appeal-01-legal-admin-intake.html', 'case_bureau_admin', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_BUREAU_DIRECTOR_ASSIGN', 'ผอ.กองบริหารคดีมอบหมาย', 'L2-APPEAL-INTAKE', '10-2-appeal-01-legal-admin-intake.html', 'case_bureau_admin', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_TRACKING_DIRECTOR_ASSIGN', 'ผอ.ติดตามคดีมอบหมาย', 'L2-APPEAL-BUREAU-ASSIGN', '10-2-appeal-02.html', 'case_bureau_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_CASE_OWNER_APPEAL_OPINION', 'นิติกรเจ้าของสำนวนให้ความเห็น', 'L2-APPEAL-TRACKING-ASSIGN', '10-2-appeal-03.html', 'case_tracking_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_AGENDA', 'ฝ่ายเลขานุการจัดวาระอุทธรณ์', 'L2-APPEAL-CASE-OWNER-OPINION', '10-2-appeal-04.html', 'original_officer', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_RULING', 'คณะอนุกรรมการวินิจฉัยอุทธรณ์พิจารณา', 'L2-APPEAL-AGENDA', '10-2-appeal-05.html', 'appeal_subcommittee_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_MEMO', 'ฝ่ายเลขานุการจัดทำบันทึกคำวินิจฉัย', 'L2-APPEAL-RULING', '10-2-appeal-06.html', 'appeal_ruling_subcommittee', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_TRACKING_DIRECTOR_SIGN', 'ผอ.ติดตามคดีลงนาม', 'L2-APPEAL-SECRETARIAT-MEMO', '10-2-appeal-07.html', 'appeal_subcommittee_secretariat', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_BUREAU_DIRECTOR_BOARD_PROPOSE', 'ผอ.กองบริหารคดีเสนอต่อคณะกรรมการ', 'L2-APPEAL-TRACKING-SIGN', '10-2-appeal-08.html', 'case_tracking_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_BOARD_DISPATCH', 'ธุรการนำส่งเรื่องต่อคณะกรรมการ', 'L2-APPEAL-BOARD-PROPOSE', '10-2-appeal-09.html', 'case_bureau_director', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_APPEAL_SUBMITTED_TO_BOARD', 'ส่งคณะกรรมการ ป.ป.ท. แล้ว (รอ Activity 7)', 'L2-APPEAL-BOARD-DISPATCH', '10-2-appeal-10.html', 'case_bureau_admin', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_APPEAL_BOARD_RESOLVED', 'คณะกรรมการมีมติต่ออุทธรณ์แล้ว (ตั้งค่าจากภายนอก)', 'L2-APPEAL-BOARD-RESOLUTION', '10-2-appeal-11.html', 'case_bureau_admin', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_NOTICE_DRAFT', 'ฝ่ายเลขานุการยกร่างหนังสือแจ้งผลอุทธรณ์', 'L2-APPEAL-BOARD-RESOLUTION', '10-2-appeal-11.html', 'case_bureau_admin', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_PENDING_APPEAL_CASE_OWNER_NOTIFY', 'นิติกรเจ้าของสำนวนแจ้งผู้อุทธรณ์', 'L2-APPEAL-NOTICE-DRAFT-2', '10-2-appeal-12.html', 'case_tracking_secretary', false) on conflict do nothing;
insert into act102.status (code, label_th, step_code, page, role, is_terminal) values ('L2_APPEAL_CASE_CLOSED_NOTIFIED', 'คำอุทธรณ์เสร็จสิ้น (แจ้งผลแล้ว)', 'L2-APPEAL-CASE-OWNER-NOTIFY', '10-2-appeal-13.html', 'original_officer', true) on conflict do nothing;

-- seed act102.resolution_type
insert into act102.resolution_type (code, label_th) values ('DISCLOSE', 'อนุญาตเปิดเผย') on conflict do nothing;
insert into act102.resolution_type (code, label_th) values ('PARTIAL', 'อนุญาตเปิดเผยบางส่วน') on conflict do nothing;
insert into act102.resolution_type (code, label_th) values ('DENY', 'ไม่อนุญาตเปิดเผย') on conflict do nothing;
insert into act102.resolution_type (code, label_th) values ('OTHER', 'อื่นๆ') on conflict do nothing;

-- seed act102.case_state
insert into act102.case_state (code, label_th) values ('CLOSED', 'คดีเสร็จสิ้นแล้ว') on conflict do nothing;
insert into act102.case_state (code, label_th) values ('INVESTIGATING', 'อยู่ระหว่างไต่สวน') on conflict do nothing;

-- seed act102.requester_type
insert into act102.requester_type (code, label_th) values ('CITIZEN', 'ประชาชน') on conflict do nothing;
insert into act102.requester_type (code, label_th) values ('JURISTIC', 'นิติบุคคล') on conflict do nothing;
insert into act102.requester_type (code, label_th) values ('AGENCY', 'หน่วยงานของรัฐ') on conflict do nothing;
insert into act102.requester_type (code, label_th) values ('OTHER', 'อื่นๆ') on conflict do nothing;

-- seed act102.request_channel
insert into act102.request_channel (code, label_th) values ('CENTRAL', 'ยื่นที่ส่วนกลาง/ศรร.') on conflict do nothing;
insert into act102.request_channel (code, label_th) values ('REGION', 'ยื่นที่สำนักงาน ป.ป.ท. เขต') on conflict do nothing;
insert into act102.request_channel (code, label_th) values ('POST', 'ไปรษณีย์') on conflict do nothing;
insert into act102.request_channel (code, label_th) values ('ELECTRONIC', 'อิเล็กทรอนิกส์') on conflict do nothing;
insert into act102.request_channel (code, label_th) values ('OTHER', 'อื่นๆ') on conflict do nothing;

-- seed act102.appeal_ruling_type
insert into act102.appeal_ruling_type (code, label_th) values ('UPHOLD', 'ยืนตามมติเดิม') on conflict do nothing;
insert into act102.appeal_ruling_type (code, label_th) values ('REVERSE_FULL', 'กลับมติเดิมทั้งหมด') on conflict do nothing;
insert into act102.appeal_ruling_type (code, label_th) values ('REVERSE_PARTIAL', 'กลับมติเดิมบางส่วน') on conflict do nothing;

-- seed act102.appeal_board_resolution_type
insert into act102.appeal_board_resolution_type (code, label_th) values ('DISCLOSE', 'ให้เปิดเผยข้อมูลทั้งหมด') on conflict do nothing;
insert into act102.appeal_board_resolution_type (code, label_th) values ('PARTIAL', 'ให้เปิดเผยข้อมูลบางส่วน') on conflict do nothing;
insert into act102.appeal_board_resolution_type (code, label_th) values ('DENY', 'ไม่เปิดเผยข้อมูล') on conflict do nothing;

-- ===== 10.3 คดีศาลปกครอง
create schema if not exists act103;

create table act103.case_file (
  id bigint generated always as identity,
  display_case_no varchar(50) not null unique,
  case_kind varchar(20) not null,
  parent_case_id bigint unique,
  origin_case_id bigint,
  pacc_case_no varchar(50),
  title text,
  category varchar(10) not null default '10.3',
  category_name varchar(100) default 'คดีศาลปกครอง',
  summons_name varchar(200),
  summons_name_other varchar(200),
  court_name varchar(200),
  court_name_other varchar(200),
  ordered_to varchar(200),
  ordered_to_other varchar(200),
  black_case_no varchar(100),
  red_case_no varchar(100),
  court_deadline_days int,
  court_received_date date,
  court_saraban_no varchar(100),
  court_remark text,
  receiving_unit varchar(200),
  law_receive_no varchar(100),
  central_saraban_no varchar(100),
  physical_doc_date date,
  verdict_date date,
  verdict_notice_no varchar(100),
  verdict_notice_date date,
  status_code varchar(50) not null,
  status_badge varchar(50),
  current_step_code varchar(50),
  current_step_seq int,
  assigned_role varchar(50),
  officer_user_id varchar(50),
  officer_name varchar(200),
  date_received date,
  due_date date,
  workflow_step int,
  has_stay_objection_summons boolean default false,
  has_stay_request boolean default false,
  detail_edited_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (parent_case_id),
  check (case_kind in ('LAWSUIT','STAY_OBJECTION','VERDICT'))
);
comment on table act103.case_file is 'แฟ้มคดีศาลปกครอง — Root table for all three case kinds (main lawsuit, stay-objection child, verdict case), distinguished by case_kind.';
create index on act103.case_file (case_kind);
create index on act103.case_file (status_code);
create index on act103.case_file (origin_case_id);

create table act103.case_party (
  id bigint generated always as identity,
  case_id bigint not null,
  party_role varchar(20) not null,
  party_name varchar(300) not null,
  ordinal int not null default 1,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  check (party_role in ('PLAINTIFF','DEFENDANT'))
);
comment on table act103.case_party is 'คู่ความ — Plaintiffs and defendants of a case, one row per named party.';
create index on act103.case_party (case_id, party_role);

create table act103.status (
  code varchar(50),
  label_th varchar(300),
  step_code varchar(50),
  page varchar(150),
  role varchar(50),
  phase_code varchar(20),
  is_terminal boolean not null default false,
  primary key (code)
);
comment on table act103.status is 'สถานะงาน (lookup) — Workflow status catalog — one row per statusCode written by Activity103.advance across all sub-flows.';
create index on act103.status (phase_code);

create table act103.case_transition (
  id bigint generated always as identity,
  case_id bigint not null,
  from_status_code varchar(50),
  to_status_code varchar(50) not null,
  action varchar(20) not null,
  decision_code varchar(50),
  step_code varchar(50),
  note text,
  actor_user_id varchar(50),
  actor_name varchar(200),
  actor_role varchar(50),
  acted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  check (action in ('SUBMIT','RETURN','BRANCH'))
);
comment on table act103.case_transition is 'ประวัติการเปลี่ยนสถานะ — Full history of every Activity103.advance() call (submit/return/branch); preserves send-back rounds instead of overwriting.';
create index on act103.case_transition (case_id, acted_at);

create table act103.signature (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(50) not null,
  signer_role varchar(50),
  signer_name varchar(200),
  signer_user_id varchar(50),
  sign_method varchar(10),
  cert_id varchar(100),
  image_data text,
  opinion_text text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, step_code),
  check (sign_method in ('PAD','CERT'))
);
comment on table act103.signature is 'ลายมือชื่อดิจิทัล — Generic signature store, one row per (case, step) — mirrors l3Signatures[stepCode] map used by every phase.';
create index on act103.signature (case_id);

create table act103.attachment (
  id bigint generated always as identity,
  case_id bigint not null,
  step_code varchar(50),
  doc_type varchar(50) not null,
  extension_request_id bigint,
  file_name varchar(500) not null,
  storage_key varchar(300),
  mime_type varchar(100),
  size_bytes bigint,
  uploaded_by varchar(50),
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id)
);
comment on table act103.attachment is 'เอกสารแนบ — Generic file-name store reused across every *FileNames / *Attachments / *DocCopies array in the source (bytes are out of scope — mockup stores names only).';
create index on act103.attachment (case_id, doc_type);
create index on act103.attachment (case_id, step_code);

create table act103.document_number (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(20) not null,
  doc_type varchar(50),
  number_type varchar(20) not null,
  doc_no varchar(100) not null,
  doc_date date,
  urgency varchar(20),
  forward_to_role varchar(50),
  notes text,
  issued_by varchar(50),
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  check (number_type in ('INTERNAL','EXTERNAL','REGISTRY'))
);
comment on table act103.document_number is 'เลขหนังสือ — Generic เลขหนังสือออก/เข้า store covering internal, external and registry doc numbers across every phase.';
create index on act103.document_number (case_id, phase_code);

create table act103.case_assignment (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(20) not null,
  step_code varchar(50),
  action_type varchar(20) not null,
  target_user_id varchar(50),
  target_name varchar(200),
  target_role varchar(50),
  notes text,
  acted_by varchar(50),
  acted_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  check (action_type in ('ASSIGN','ORDER'))
);
comment on table act103.case_assignment is 'ประวัติมอบหมาย/สั่งการ — Generic 1:N history of director/group-director order & assignment notes (l*DirectorOrderNotes, l*GroupAssignNotes, …) across all phases — fixes the mockup gap where these were overwritten per step.';
create index on act103.case_assignment (case_id, phase_code);

create table act103.case_review (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(20) not null,
  step_code varchar(50),
  round_no int not null default 1,
  reviewer_role varchar(50),
  primary_decision varchar(20),
  secondary_decision varchar(20),
  is_return boolean not null default false,
  notes text,
  reviewed_by varchar(200),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  check (primary_decision in ('APPROVE','RETURN','REJECT') or primary_decision is null)
);
comment on table act103.case_review is 'ประวัติตรวจสอบ/ส่งกลับ — Generic 1:N review/return/reject history reused across l3AnswerGroupReview, l3AnswerDirectorReview, l3AnswerReturn, l3AnswerPackage, l7/l8/l9/l9a/l9b/l10 group & director approve/reject notes. Fixes the mockup gap where each review round overwrote the previous one (l3AnswerReturn: undefined pattern).';
create index on act103.case_review (case_id, phase_code, round_no);

create table act103.case_draft_opinion (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(20) not null,
  review_notes text,
  related_case_no varchar(100),
  opinion_text text,
  draft_text text,
  intake_notes text,
  proposed_branch varchar(20),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, phase_code)
);
comment on table act103.case_draft_opinion is 'ความเห็น/ร่างของนิติกร — Generic 1:1-per-phase opinion/draft table reused for lawyer review notes (Part1), verdict-analysis opinion (l8*), and appeal draft text (l7/l9a/l9b).';
create index on act103.case_draft_opinion (case_id);

create table act103.postal_dispatch (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(20) not null,
  method varchar(30),
  tracking_no varchar(100),
  post_date date,
  post_office varchar(200),
  destination varchar(300),
  address text,
  fee numeric(10,2),
  sent_date date,
  received_date date,
  hand_delivery_date date,
  hand_delivery_location varchar(300),
  notes text,
  posted_by varchar(200),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, phase_code)
);
comment on table act103.postal_dispatch is 'การจัดส่งเอกสาร — Generic 1:1-per-phase dispatch record (post/hand delivery) reused across l3AnswerPosting, l3StayDispatch*, l7/l9/l9a/l9b/l10 Send* groups.';
create index on act103.postal_dispatch (case_id);

create table act103.delivery_tracking (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(20) not null default 'ANSWER',
  delivered_date date,
  receiver_name varchar(200),
  prosecutor_ack_no varchar(100),
  court_filed_date date,
  on_time boolean,
  notes text,
  tracked_by varchar(200),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, phase_code)
);
comment on table act103.delivery_tracking is 'การติดตามผลจัดส่ง — Header for l3AnswerTracking — final delivery confirmation and prosecutor acknowledgement, 1:1 per (case, phase).';
create index on act103.delivery_tracking (case_id);

create table act103.postal_tracking_event (
  id bigint generated always as identity,
  tracking_id bigint not null,
  event_seq int not null default 1,
  event_date date,
  status_text varchar(50),
  detail text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id)
);
comment on table act103.postal_tracking_event is 'เหตุการณ์การติดตามพัสดุ — Child events of delivery_tracking (l3AnswerTracking.events[]).';
create index on act103.postal_tracking_event (tracking_id, event_seq);

create table act103.court_order (
  case_id bigint,
  order_received_date date,
  order_no varchar(100),
  order_date date,
  result_code varchar(20),
  intake_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act103.court_order is 'คำสั่งศาลเรื่องทุเลาการบังคับคดี — 1:1 on the stay-objection child case — the court order intake result and branch (Part 1b step LAW0100_0101).';

create table act103.tbl_law3_board_notice (
  bn3_case_id bigint,
  bn3_notified_by varchar(200),
  bn3_notified_at timestamptz,
  bn3_notes text,
  bn3_acknowledged_by varchar(200),
  bn3_acknowledged_at timestamptz,
  created_datetime timestamptz not null default now(),
  created_by integer,
  updated_datetime timestamptz,
  updated_by integer,
  primary key (bn3_case_id)
);
comment on table act103.tbl_law3_board_notice is 'การรับแจ้งและกระจายผลมติคณะกรรมการ ป.ป.ท. — 1:1 — l3ResolutionNotice header (recipients are a child table).';

create table act103.tbl_law3_board_notice_recipient (
  br3_id bigint generated always as identity,
  br3_case_id bigint not null,
  br3_role varchar(50),
  br3_label varchar(200),
  br3_name varchar(200),
  created_datetime timestamptz not null default now(),
  created_by integer,
  updated_datetime timestamptz,
  updated_by integer,
  primary key (br3_id)
);
comment on table act103.tbl_law3_board_notice_recipient is 'ผู้รับแจ้งผลมติ — 1:N — l3ResolutionNotice.recipients[].';
create index on act103.tbl_law3_board_notice_recipient (br3_case_id);

create table act103.extension_request (
  id bigint generated always as identity,
  case_id bigint not null,
  round_no int not null,
  filed_date date,
  requested_days int,
  result_code varchar(20),
  granted_days int,
  order_date date,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, round_no),
  check (result_code in ('PENDING','GRANTED','DENIED'))
);
comment on table act103.extension_request is 'คำขอขยายเวลายื่นคำให้การ — 1:N — l3ExtensionRequests[], one row per round instead of overwriting.';
create index on act103.extension_request (case_id);

create table act103.answer_document_set (
  id bigint generated always as identity,
  case_id bigint not null,
  version_no int not null,
  answer_original_due_date date,
  answer_due_date date,
  extension_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, version_no)
);
comment on table act103.answer_document_set is 'ชุดร่างคำให้การ — Versioned — l3AnswerDocs {answerFileNames, letterFileNames, evidenceNames, version}; bumped on every re-submission after a return.';
create index on act103.answer_document_set (case_id);

create table act103.cover_letter_signing (
  case_id bigint,
  signer_role varchar(20),
  signer_name varchar(200),
  checked_answer boolean,
  checked_letter boolean,
  opinion text,
  signed_by varchar(200),
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act103.cover_letter_signing is 'การลงนามหนังสือนำส่ง — 1:1 — l3CoverLetterSigning + the routing choice (secgen vs deputy_sg) made at 10-3-17.';

create table act103.answer_chairman_signing (
  case_id bigint,
  checked_answer boolean,
  checked_evidence boolean,
  checked_letter boolean,
  notes text,
  signed_by varchar(200),
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act103.answer_chairman_signing is 'การลงนามของประธานกรรมการ (คำให้การ) — 1:1 — l3AnswerChairmanSigning checklist at 10-3-21.';

create table act103.answer_originals_checklist (
  case_id bigint,
  chk_answer boolean,
  chk_letter boolean,
  chk_evidence boolean,
  chk_copy boolean,
  notes text,
  collected_date date,
  forward_to varchar(200),
  collected_by varchar(200),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act103.answer_originals_checklist is 'รายการรับเอกสารฉบับจริง — 1:1 — l3AnswerOriginals {checklist, extraNames, notes, collectedDate, forwardTo, collectedBy} at 10-3-22.';

create table act103.verdict_detail (
  case_id bigint,
  reg_no varchar(100),
  reg_date date,
  reg_notes text,
  issues text,
  result varchar(50),
  summary text,
  read_date date,
  appeal_deadline date,
  appeal_by_plaintiff varchar(100),
  opinion_text text,
  proposed_branch varchar(20),
  director_decision varchar(20),
  director_branch_reason text,
  director_decide_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act103.verdict_detail is 'ผลคำพิพากษาและแนวทางดำเนินการ — 1:1 on the VERDICT case — lawyer analysis (l3Verdict*), director decision (l3Director*), and registration numbers (l3VerdictReg*).';

create table act103.case_close (
  case_id bigint,
  final_date date,
  close_action varchar(50),
  close_notes text,
  close_doc_no varchar(100),
  mti_sent_date date,
  mti_received_date date,
  ems_tracking varchar(100),
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (case_id)
);
comment on table act103.case_close is 'การปิดสำนวน — 1:1 per case — reused for main-lawsuit/verdict close (l3Close*, l3Mti*), stay-objection close (l3StayCloseNotes) and board-no-appeal close (l9bCloseNotes); each case only closes once so case_id alone is PK.';

create table act103.phase_intake (
  id bigint generated always as identity,
  case_id bigint not null,
  phase_code varchar(10) not null,
  central_saraban_no varchar(100),
  physical_doc_date date,
  law_receive_no varchar(100),
  notice_date date,
  receive_no varchar(100),
  receive_date date,
  case_reg_no varchar(100),
  case_reg_date date,
  reg_notes text,
  intake_notes text,
  created_at timestamptz not null default now(),
  created_by varchar(50),
  updated_at timestamptz,
  updated_by varchar(50),
  primary key (id),
  unique (case_id, phase_code),
  check (phase_code in ('L7','L8','L9A','L9B'))
);
comment on table act103.phase_intake is 'รับเรื่อง/ลงทะเบียนคดี (สายงานย่อย) — Generic 1:1-per-phase intake/registration record reused across appeal-reply (L7), appeal-consider (L8), board-approved-appeal (L9A) and board-no-appeal (L9B) — all four share the same central-saraban/law-receive/case-registration shape.';
create index on act103.phase_intake (case_id);

create table act103.case_kind (
  code varchar(50),
  label_th varchar(300),
  primary key (code)
);
comment on table act103.case_kind is 'ประเภทคดี (lookup) — LAWSUIT | STAY_OBJECTION | VERDICT';

create table act103.court_order_branch (
  code varchar(50),
  label_th varchar(300),
  result_status_code varchar(50),
  primary key (code)
);
comment on table act103.court_order_branch is 'ผลคำสั่งศาล (lookup) — COURT_ORDER_BRANCHES from ecmis-10-3.js';

create table act103.verdict_branch (
  code varchar(50),
  label_th varchar(300),
  result_label_th varchar(300),
  proposal_th varchar(300),
  result_status_code varchar(50),
  primary key (code)
);
comment on table act103.verdict_branch is 'แนวทางดำเนินการหลังคำพิพากษา (lookup) — VERDICT_BRANCHES from ecmis-10-3.js';

create table act103.appeal_consider_branch (
  code varchar(50),
  label_th varchar(300),
  proposal_th varchar(300),
  result_status_code varchar(50),
  primary key (code)
);
comment on table act103.appeal_consider_branch is 'ความเห็นควรอุทธรณ์ (lookup) — APPEAL_CONSIDER_BRANCHES from ecmis-10-3.js';

create table act103.cover_signer_route (
  code varchar(50),
  label_th varchar(300),
  role varchar(50),
  result_status_code varchar(50),
  primary key (code)
);
comment on table act103.cover_signer_route is 'ผู้ลงนามหนังสือนำส่ง (lookup) — COVER_SIGNER_ROUTES from ecmis-10-3.js';

create table act103.step (
  code varchar(50),
  seq int,
  page varchar(150) not null,
  role varchar(50),
  phase_code varchar(20) not null,
  label_th text,
  entry_status_code varchar(50),
  result_status_code varchar(50),
  primary key (code)
);
comment on table act103.step is 'ขั้นตอนงาน (lookup) — Catalog of every step code across all STEPS tables (§5) — FK target for status/signature/attachment/case_assignment/case_review/document history.';
create index on act103.step (phase_code);

create table act103.tbl_law3_board_link (
  lb3_id bigint generated always as identity,
  lb3_case_id bigint not null,
  lb3_send_point varchar(10) not null,
  lb3_round_no smallint not null default 1,
  lb3_send_step_code varchar(10) not null,
  lb3_receive_step_code varchar(10),
  lb3_tbs_id bigint not null,
  lb3_submission_no varchar(50),
  lb3_matter_type varchar(3) not null,
  created_datetime timestamptz not null default now(),
  created_by integer,
  updated_datetime timestamptz,
  updated_by integer,
  primary key (lb3_id),
  unique (lb3_tbs_id),
  unique (lb3_case_id, lb3_send_point, lb3_round_no),
  check (lb3_send_point in ('S103-1', 'S103-2')),
  check (lb3_round_no >= 1)
);
comment on table act103.tbl_law3_board_link is 'การส่งเรื่องเข้ากิจกรรมที่ 7 (เชื่อม tbl_board_submission) — One row per submission from this sub-activity to กิจกรรมที่ 7; the resolution itself is read from tbl_board_submission.';
create index on act103.tbl_law3_board_link (lb3_case_id);

-- act103: tbl_board_submission is owned by another module (reference only, not created here)

alter table act103.case_file add constraint fk_case_file_case_kind foreign key (case_kind) references act103.case_kind (code);
alter table act103.case_file add constraint fk_case_file_parent_case_id foreign key (parent_case_id) references act103.case_file (id);
alter table act103.case_file add constraint fk_case_file_origin_case_id foreign key (origin_case_id) references act103.case_file (id);
alter table act103.case_file add constraint fk_case_file_status_code foreign key (status_code) references act103.status (code);
alter table act103.case_file add constraint fk_case_file_current_step_code foreign key (current_step_code) references act103.step (code);
alter table act103.case_party add constraint fk_case_party_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.status add constraint fk_status_step_code foreign key (step_code) references act103.step (code);
alter table act103.case_transition add constraint fk_case_transition_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.case_transition add constraint fk_case_transition_from_status_code foreign key (from_status_code) references act103.status (code);
alter table act103.case_transition add constraint fk_case_transition_to_status_code foreign key (to_status_code) references act103.status (code);
alter table act103.case_transition add constraint fk_case_transition_step_code foreign key (step_code) references act103.step (code);
alter table act103.signature add constraint fk_signature_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.signature add constraint fk_signature_step_code foreign key (step_code) references act103.step (code);
alter table act103.attachment add constraint fk_attachment_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.attachment add constraint fk_attachment_step_code foreign key (step_code) references act103.step (code);
alter table act103.attachment add constraint fk_attachment_extension_request_id foreign key (extension_request_id) references act103.extension_request (id);
alter table act103.document_number add constraint fk_document_number_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.case_assignment add constraint fk_case_assignment_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.case_assignment add constraint fk_case_assignment_step_code foreign key (step_code) references act103.step (code);
alter table act103.case_review add constraint fk_case_review_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.case_review add constraint fk_case_review_step_code foreign key (step_code) references act103.step (code);
alter table act103.case_draft_opinion add constraint fk_case_draft_opinion_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.postal_dispatch add constraint fk_postal_dispatch_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.delivery_tracking add constraint fk_delivery_tracking_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.postal_tracking_event add constraint fk_postal_tracking_event_tracking_id foreign key (tracking_id) references act103.delivery_tracking (id);
alter table act103.court_order add constraint fk_court_order_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.court_order add constraint fk_court_order_result_code foreign key (result_code) references act103.court_order_branch (code);
alter table act103.tbl_law3_board_notice add constraint fk_tbl_law3_board_notice_bn3_case_id foreign key (bn3_case_id) references act103.case_file (id);
alter table act103.tbl_law3_board_notice_recipient add constraint fk_tbl_law3_board_notice_recipient_br3_case_id foreign key (br3_case_id) references act103.tbl_law3_board_notice (bn3_case_id);
alter table act103.extension_request add constraint fk_extension_request_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.answer_document_set add constraint fk_answer_document_set_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.cover_letter_signing add constraint fk_cover_letter_signing_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.cover_letter_signing add constraint fk_cover_letter_signing_signer_role foreign key (signer_role) references act103.cover_signer_route (code);
alter table act103.answer_chairman_signing add constraint fk_answer_chairman_signing_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.answer_originals_checklist add constraint fk_answer_originals_checklist_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.verdict_detail add constraint fk_verdict_detail_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.verdict_detail add constraint fk_verdict_detail_proposed_branch foreign key (proposed_branch) references act103.verdict_branch (code);
alter table act103.verdict_detail add constraint fk_verdict_detail_director_decision foreign key (director_decision) references act103.verdict_branch (code);
alter table act103.case_close add constraint fk_case_close_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.phase_intake add constraint fk_phase_intake_case_id foreign key (case_id) references act103.case_file (id);
alter table act103.court_order_branch add constraint fk_court_order_branch_result_status_code foreign key (result_status_code) references act103.status (code);
alter table act103.verdict_branch add constraint fk_verdict_branch_result_status_code foreign key (result_status_code) references act103.status (code);
alter table act103.appeal_consider_branch add constraint fk_appeal_consider_branch_result_status_code foreign key (result_status_code) references act103.status (code);
alter table act103.cover_signer_route add constraint fk_cover_signer_route_result_status_code foreign key (result_status_code) references act103.status (code);
alter table act103.step add constraint fk_step_result_status_code foreign key (result_status_code) references act103.status (code);
alter table act103.tbl_law3_board_link add constraint fk_tbl_law3_board_link_lb3_case_id foreign key (lb3_case_id) references act103.case_file (id);

-- seed act103.case_kind
insert into act103.case_kind (code, label_th) values ('LAWSUIT', 'คดีศาลปกครอง (หลัก)') on conflict do nothing;
insert into act103.case_kind (code, label_th) values ('STAY_OBJECTION', 'คำขอทุเลาการบังคับคดี (คดีลูก)') on conflict do nothing;
insert into act103.case_kind (code, label_th) values ('VERDICT', 'ผลคำพิพากษา') on conflict do nothing;

-- seed act103.court_order_branch
insert into act103.court_order_branch (code, label_th, result_status_code) values ('GRANTED', 'ศาลมีคำสั่งให้ทุเลาการบังคับคดี', 'L3B2_APPEAL_FILED') on conflict do nothing;
insert into act103.court_order_branch (code, label_th, result_status_code) values ('DENIED', 'ศาลยกคำขอทุเลาการบังคับคดี', 'L3B2_CLOSED') on conflict do nothing;

-- seed act103.verdict_branch
insert into act103.verdict_branch (code, label_th, result_label_th, proposal_th, result_status_code) values ('APPEAL_REPLY', 'ชนะคดี (ผู้ฟ้องคดียื่นอุทธรณ์)', 'ชนะคดี', 'จัดทำคำแก้อุทธรณ์', 'L3V_TO_APPEAL_REPLY') on conflict do nothing;
insert into act103.verdict_branch (code, label_th, result_label_th, proposal_th, result_status_code) values ('APPEAL_CONSIDER', 'แพ้คดี', 'แพ้คดี', 'พิจารณาความเห็นควรอุทธรณ์', 'L3V_TO_APPEAL_CONSIDER') on conflict do nothing;
insert into act103.verdict_branch (code, label_th, result_label_th, proposal_th, result_status_code) values ('CLOSE', 'ชนะคดี (ผู้ฟ้องคดีไม่ยื่นอุทธรณ์)', 'ชนะคดี', 'ยุติ/ปิดสำนวน', 'L3V_TO_CLOSE') on conflict do nothing;

-- seed act103.appeal_consider_branch
insert into act103.appeal_consider_branch (code, label_th, proposal_th, result_status_code) values ('APPEAL', 'นิติกรเห็นควรอุทธรณ์', 'จัดทำคำอุทธรณ์', 'L8_TO_APPEAL_DRAFT') on conflict do nothing;
insert into act103.appeal_consider_branch (code, label_th, proposal_th, result_status_code) values ('BOARD', 'นิติกรเห็นควรไม่อุทธรณ์', 'เสนอมติต่อบอร์ด', 'L8_TO_BOARD_PROPOSE') on conflict do nothing;

-- seed act103.cover_signer_route
insert into act103.cover_signer_route (code, label_th, role, result_status_code) values ('secgen', 'เลขาธิการ ป.ป.ท.', 'secgen', 'L3_PENDING_SECGEN_COVER_SIGN') on conflict do nothing;
insert into act103.cover_signer_route (code, label_th, role, result_status_code) values ('deputy_sg', 'รองเลขาธิการ ป.ป.ท. (ปฏิบัติราชการแทนเลขาธิการ)', 'deputy_sg', 'L3_PENDING_DEPUTY_SG_COVER_SIGN') on conflict do nothing;

-- seed act103.step
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0085', 'ธุรการกองกฎหมาย รับเรื่องและเสนอ ผอ.กองกฎหมาย', 1, '02-board-intake.html', 'admin_legal', 'LAWSUIT', null, 'L3_PENDING_DIRECTOR_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0088', 'ผอ.กองกฎหมาย ลงนามมอบหมาย', 2, '10-3-02-legal-director-assign.html', 'dir_legal', 'LAWSUIT', 'L3_PENDING_DIRECTOR_ASSIGN', 'L3_PENDING_GROUP_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0089', 'ผอ.กลุ่มงาน มอบหมายนิติกรผู้รับผิดชอบ', 3, '10-3-03-group-director-assign.html', 'case_group_director', 'LAWSUIT', 'L3_PENDING_GROUP_ASSIGN', 'L3_PENDING_LAWYER_REVIEW') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0090', 'นิติกร ตรวจสอบคำฟ้องและจัดทำบันทึกความเห็น', 4, '10-3-04-lawyer-review-complaint.html', 'case_legal_officer', 'LAWSUIT', 'L3_PENDING_LAWYER_REVIEW', 'L3_PENDING_GROUP_APPROVE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0093', 'ผอ.กลุ่มงาน พิจารณาและเห็นชอบ', 5, '10-3-07-group-director-approve.html', 'case_group_director', 'LAWSUIT', 'L3_PENDING_GROUP_APPROVE', 'L3_PENDING_DIRECTOR_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0094', 'ผอ.กองกฎหมาย ตรวจสอบและลงนามผ่านเรื่อง', 6, '10-3-08-legal-director-sign.html', 'dir_legal', 'LAWSUIT', 'L3_PENDING_DIRECTOR_SIGN', 'L3_PENDING_ADMIN_DISPATCH') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0095', 'ธุรการ ออกเลขส่งภายในและส่งมติเสนอบอร์ด', 7, '10-3-09-legal-admin-dispatch.html', 'admin_legal', 'LAWSUIT', 'L3_PENDING_ADMIN_DISPATCH', 'L3_READY_FOR_BOARD') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0097', 'นิติกร จัดทำคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี', 1, '10-3b-01-lawyer-draft-stay-objection.html', 'case_legal_officer', 'STAY_OBJECTION', 'L3B_PENDING_LAWYER_DRAFT', 'L3B_PENDING_CHAIRMAN_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0098', 'ประธานกรรมการ ป.ป.ท. ลงนามคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี', 2, '10-3b-02-chairman-sign-stay-objection.html', 'chairman', 'STAY_OBJECTION', 'L3B_PENDING_CHAIRMAN_SIGN', 'L3B_PENDING_LAWYER_DISPATCH') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0099', 'นิติกร ส่งคำชี้แจงคัดค้านต่อศาลปกครอง', 3, '10-3b-03-lawyer-dispatch-stay-objection.html', 'case_legal_officer', 'STAY_OBJECTION', 'L3B_PENDING_LAWYER_DISPATCH', 'L3B_CLOSED') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0100_0101', 'นิติกร รับคำวินิจฉัย/คำสั่งศาลปกครองเรื่องทุเลาการบังคับคดี', 1, '10-3b-04-lawyer-court-order-intake.html', 'case_legal_officer', 'STAY_OBJECTION', 'L3B_CLOSED', 'L3B2_APPEAL_FILED') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-19', 'ธุรการกองกฎหมาย รับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท.', 1, '10-3-10-legal-admin-resolution-notice.html', 'admin_legal', 'ANSWER', 'L3_READY_FOR_BOARD', 'L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-20', 'ผอ.กองกฎหมาย พิจารณาผลมติและมอบหมายงาน', 2, '10-3-11-legal-director-assign-resolution.html', 'dir_legal', 'ANSWER', 'L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN', 'L3_PENDING_GROUP_RESOLUTION_APPROVE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-21', 'ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบผลมติ/ข้อสั่งการ', 3, '10-3-12-group-director-approve-resolution.html', 'case_group_director', 'ANSWER', 'L3_PENDING_GROUP_RESOLUTION_APPROVE', 'L3_PENDING_LAWYER_EXTENSION') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-22', 'นิติกร ยื่นคำขอขยายเวลาต่อศาลและร่างคำให้การแก้คำฟ้อง', 4, '10-3-13-lawyer-request-extension.html', 'case_legal_officer', 'ANSWER', 'L3_PENDING_LAWYER_EXTENSION', 'L3_PENDING_GROUP_ANSWER_REVIEW') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-24', 'ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ', 5, '10-3-15-group-director-review-answer.html', 'case_group_director', 'ANSWER', 'L3_PENDING_GROUP_ANSWER_REVIEW', 'L3_PENDING_DIRECTOR_ANSWER_REVIEW') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-25', 'ผอ.กองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง', 6, '10-3-16-legal-director-review-answer.html', 'dir_legal', 'ANSWER', 'L3_PENDING_DIRECTOR_ANSWER_REVIEW', 'L3_PENDING_ADMIN_ANSWER_INTERNAL_NO') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-26', 'ธุรการกองกฎหมาย ออกเลขหนังสือส่งภายในและเสนอผู้ลงนาม', 7, '10-3-17-legal-admin-internal-dispatch-answer.html', 'admin_legal', 'ANSWER', 'L3_PENDING_ADMIN_ANSWER_INTERNAL_NO', 'L3_PENDING_SECGEN_COVER_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-27A', 'เลขาธิการ ป.ป.ท. ตรวจคำให้การและลงนามหนังสือนำส่ง', 8, '10-3-18-secgen-sign-cover-letter.html', 'secgen', 'ANSWER', 'L3_PENDING_SECGEN_COVER_SIGN', 'L3_PENDING_REGISTRY_ANSWER_EXTERNAL_NO') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-27B', 'รองเลขาธิการ ป.ป.ท. (ปฏิบัติราชการแทน) ตรวจคำให้การและลงนามหนังสือนำส่ง', 8, '10-3-19-deputy-sg-sign-cover-letter.html', 'deputy_sg', 'ANSWER', 'L3_PENDING_DEPUTY_SG_COVER_SIGN', 'L3_PENDING_REGISTRY_ANSWER_EXTERNAL_NO') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-28', 'สารบรรณกลาง ออกเลขหนังสือส่งออก', 9, '10-3-20-registry-issue-external-no.html', 'registry', 'ANSWER', 'L3_PENDING_REGISTRY_ANSWER_EXTERNAL_NO', 'L3_PENDING_CHAIRMAN_ANSWER_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-29', 'ประธานกรรมการ ป.ป.ท. ลงนามในคำให้การแก้คำฟ้อง', 10, '10-3-21-chairman-sign-answer.html', 'chairman', 'ANSWER', 'L3_PENDING_CHAIRMAN_ANSWER_SIGN', 'L3_PENDING_ADMIN_COLLECT_ORIGINALS') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-30', 'ธุรการกองกฎหมาย รวบรวมเอกสารฉบับจริงที่ลงนามครบถ้วนแล้ว', 11, '10-3-22-legal-admin-collect-originals.html', 'admin_legal', 'ANSWER', 'L3_PENDING_ADMIN_COLLECT_ORIGINALS', 'L3_PENDING_LAWYER_COLLECT_DOCS') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-31', 'นิติกร กลุ่มงานคดี รวบรวมร่างคำให้การและเอกสารที่เกี่ยวข้อง', 12, '10-3-23-lawyer-collect-documents.html', 'case_legal_officer', 'ANSWER', 'L3_PENDING_LAWYER_COLLECT_DOCS', 'L3_PENDING_LAWYER_POST_TO_PROSECUTOR') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-32', 'นิติกรเจ้าของเรื่อง จัดส่งทางไปรษณีย์ไปยังสำนักงานคดีปกครอง', 13, '10-3-24-lawyer-post-to-prosecutor.html', 'case_legal_officer', 'ANSWER', 'L3_PENDING_LAWYER_POST_TO_PROSECUTOR', 'L3_PENDING_LAWYER_TRACK_STATUS') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L3-33', 'นิติกร ติดตามสถานะการจัดส่งและใบตอบรับ', 14, '10-3-25-lawyer-track-status.html', 'case_legal_officer', 'ANSWER', 'L3_PENDING_LAWYER_TRACK_STATUS', 'L3_AWAITING_JUDGMENT') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0119', 'ธุรการ รับหนังสือแจ้งผลคำพิพากษาและลงทะเบียนคดีปกครอง', 0, '10-3v-00-legal-admin-verdict-intake.html', 'admin_legal', 'VERDICT', null, 'L3V_PENDING_DIRECTOR_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0121', 'ผอ.กองกฎหมาย แจกจ่าย/มอบหมาย (คำพิพากษา)', 1, '10-3v-02-legal-director-assign.html', 'dir_legal', 'VERDICT', 'L3V_PENDING_DIRECTOR_ASSIGN', 'L3V_PENDING_GROUP_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0122', 'ผอ.กลุ่มงาน มอบหมายนิติกร (คำพิพากษา)', 2, '10-3v-03-group-director-assign.html', 'case_group_director', 'VERDICT', 'L3V_PENDING_GROUP_ASSIGN', 'L3V_PENDING_LAWYER_ANALYSIS') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0123', 'นิติกร ตรวจ/วิเคราะห์ผลคำพิพากษา', 3, '10-3v-04-lawyer-verdict-analysis.html', 'case_legal_officer', 'VERDICT', 'L3V_PENDING_LAWYER_ANALYSIS', 'L3V_PENDING_GROUP_APPROVE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0126', 'ผอ.กลุ่มงาน พิจารณาและเห็นชอบ (คำพิพากษา)', 4, '10-3v-05-group-director-approve.html', 'case_group_director', 'VERDICT', 'L3V_PENDING_GROUP_APPROVE', 'L3V_PENDING_DIRECTOR_DECIDE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0127', 'ผอ.กองกฎหมาย กำหนดแนวทางดำเนินการ (คำพิพากษา)', 5, '10-3v-06-legal-director-decide.html', 'dir_legal', 'VERDICT', 'L3V_PENDING_DIRECTOR_DECIDE', 'L3V_DECIDED') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0163', 'นิติกร ดำเนินการตามคำพิพากษา/ปิดสำนวน', 6, '10-3v-07-lawyer-close-case.html', 'case_legal_officer', 'VERDICT', 'L3V_DECIDED,L3V_TO_CLOSE', 'L3V_CLOSED') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0131', 'ธุรการ รับหนังสือแจ้งคำสั่งศาลให้ทำคำแก้อุทธรณ์', 0, '10-3v-08-legal-admin-appeal-intake.html', 'admin_legal', 'L7', 'L3V_TO_APPEAL_REPLY', 'L7_PENDING_DIRECTOR_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0135', 'ผอ.กองกฎหมาย แจกจ่าย/มอบหมาย (คำแก้อุทธรณ์)', 1, '10-3v-09-legal-director-assign.html', 'dir_legal', 'L7', 'L7_PENDING_DIRECTOR_ASSIGN', 'L7_PENDING_GROUP_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L7ASSIGN', 'ผอ.กลุ่มงาน มอบหมายนิติกร (คำแก้อุทธรณ์)', 2, '10-3v-10-group-director-assign.html', 'case_group_director', 'L7', 'L7_PENDING_GROUP_ASSIGN', 'L7_PENDING_LAWYER_DRAFT') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0133', 'นิติกร ลงทะเบียนคดี/ตรวจสอบ/ร่างคำแก้อุทธรณ์', 3, '10-3v-11-lawyer-draft-appeal-reply.html', 'case_legal_officer', 'L7', 'L7_PENDING_LAWYER_DRAFT', 'L7_PENDING_GROUP_APPROVE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0134', 'ผอ.กลุ่มงาน ตรวจร่างคำแก้อุทธรณ์และเห็นชอบ', 4, '10-3v-12-group-director-approve.html', 'case_group_director', 'L7', 'L7_PENDING_GROUP_APPROVE', 'L7_PENDING_DIRECTOR_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0139', 'ผอ.กองกฎหมาย พิจารณาและลงนามในคำแก้อุทธรณ์', 5, '10-3v-13-legal-director-sign.html', 'dir_legal', 'L7', 'L7_PENDING_DIRECTOR_SIGN', 'L7_PENDING_ADMIN_DISPATCH') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0140', 'ธุรการ ออกเลขหนังสือส่งภายนอก', 6, '10-3v-14-legal-admin-dispatch.html', 'admin_legal', 'L7', 'L7_PENDING_ADMIN_DISPATCH', 'L7_PENDING_LAWYER_SEND') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0141', 'นิติกร ส่งหนังสือและคำแก้อุทธรณ์ไปสำนักงานคดีปกครอง', 7, '10-3v-15-lawyer-send-appeal-reply.html', 'case_legal_officer', 'L7', 'L7_PENDING_LAWYER_SEND', 'L7_SENT_TO_PROSECUTOR') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0143', 'ธุรการ รับหนังสือแจ้งผลคำพิพากษาเพื่อพิจารณาอุทธรณ์', 0, '10-3v-16-legal-admin-appeal-consider-intake.html', 'admin_legal', 'L8', 'L3V_TO_APPEAL_CONSIDER', 'L8_PENDING_DIRECTOR_ASSIGN1') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L8ASSIGN1', 'ผอ.กองกฎหมาย มอบหมาย ผอ.กลุ่มงานคดี (ลงทะเบียนคดี)', 1, '10-3v-17-legal-director-assign1.html', 'dir_legal', 'L8', 'L8_PENDING_DIRECTOR_ASSIGN1', 'L8_PENDING_GROUP_ASSIGN1') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L8GROUPASSIGN1', 'ผอ.กลุ่มงาน มอบหมายนิติกร (ลงทะเบียนคดี)', 2, '10-3v-18-group-director-assign1.html', 'case_group_director', 'L8', 'L8_PENDING_GROUP_ASSIGN1', 'L8_PENDING_LAWYER_REGISTER') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0145', 'นิติกร ลงทะเบียนคดี/ตรวจสอบคำพิพากษา/เสนอความเห็นควรอุทธรณ์', 3, '10-3v-19-lawyer-register.html', 'case_legal_officer', 'L8', 'L8_PENDING_LAWYER_REGISTER', 'L8_PENDING_GROUP_APPROVE1') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0146', 'ผอ.กลุ่มงาน พิจารณาและยืนยันความเห็นควรอุทธรณ์', 4, '10-3v-20-group-director-approve1.html', 'case_group_director', 'L8', 'L8_PENDING_GROUP_APPROVE1', 'L8_DECIDED') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0157', 'ผอ.กลุ่มงาน ตรวจร่างคำอุทธรณ์', 0, '10-3v-22-group-director-review-appeal.html', 'case_group_director', 'L10', 'L8_TO_APPEAL_DRAFT', 'L10_PENDING_DIRECTOR_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0158', 'ผอ.กองกฎหมาย พิจารณาและลงนามคำอุทธรณ์/หนังสือถึงสำนักงานคดีปกครอง', 1, '10-3v-23-legal-director-sign-appeal.html', 'dir_legal', 'L10', 'L10_PENDING_DIRECTOR_SIGN', 'L10_PENDING_DOC_NO') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0159', 'ธุรการ ออกเลขหนังสือส่งภายนอก', 2, '10-3v-24-legal-admin-dispatch.html', 'admin_legal', 'L10', 'L10_PENDING_DOC_NO', 'L10_PENDING_LAWYER_SEND') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0160', 'นิติกร ส่งหนังสือและคำอุทธรณ์ไปยังสำนักงานคดีปกครอง', 3, '10-3v-25-lawyer-send-appeal.html', 'case_legal_officer', 'L10', 'L10_PENDING_LAWYER_SEND', 'L10_SENT_TO_PROSECUTOR') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0150', 'ผอ.กลุ่มงาน พิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)', 0, '10-3v-26-group-director-board-approve.html', 'case_group_director', 'L9', 'L8_TO_BOARD_PROPOSE', 'L9_PENDING_DIRECTOR_APPROVE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0151', 'ผอ.กองกฎหมาย พิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)', 1, '10-3v-27-legal-director-board-approve.html', 'dir_legal', 'L9', 'L9_PENDING_DIRECTOR_APPROVE', 'L9_PENDING_DOC_SEND') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0152', 'ธุรการ ส่งมติเสนอบอร์ด', 2, '10-3v-28-legal-admin-board-propose.html', 'admin_legal', 'L9', 'L9_PENDING_DOC_SEND', 'L9_PROPOSED_TO_BOARD') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L9A_INTAKE', 'ธุรการ รับหนังสือแจ้งมติบอร์ดเห็นชอบให้อุทธรณ์', 0, '10-3v-29-legal-admin-board-appeal-intake.html', 'admin_legal', 'L9A', 'L9_BOARD_APPROVED_APPEAL', 'L9A_PENDING_DIRECTOR_ASSIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0155', 'ผอ.กองกฎหมาย พิจารณาและมอบหมายงาน', 1, '10-3v-30-legal-director-assign2.html', 'dir_legal', 'L9A', 'L9A_PENDING_DIRECTOR_ASSIGN', 'L9A_PENDING_GROUP_APPROVE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0154', 'ผอ.กลุ่มงานคดี พิจารณาเห็นชอบและมอบหมายนิติกรดำเนินการ', 2, '10-3v-31-group-director-assign2.html', 'case_group_director', 'L9A', 'L9A_PENDING_GROUP_APPROVE', 'L9A_PENDING_LAWYER_DRAFT') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0153_0156', 'นิติกร รับเรื่องเพื่อดำเนินการแจ้งผล และร่างคำอุทธรณ์', 3, '10-3v-32-lawyer-draft-appeal2.html', 'case_legal_officer', 'L9A', 'L9A_PENDING_LAWYER_DRAFT', 'L9A_PENDING_GROUP_REVIEW') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0157B', 'ผอ.กลุ่มงาน ตรวจร่างคำอุทธรณ์', 4, '10-3v-33-group-director-review-appeal2.html', 'case_group_director', 'L9A', 'L9A_PENDING_GROUP_REVIEW', 'L9A_PENDING_DIRECTOR_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0158B', 'ผอ.กองกฎหมาย พิจารณาและลงนามคำอุทธรณ์/หนังสือถึงสำนักงานคดีปกครอง', 5, '10-3v-34-legal-director-sign-appeal2.html', 'dir_legal', 'L9A', 'L9A_PENDING_DIRECTOR_SIGN', 'L9A_PENDING_DOC_NO') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0159B', 'ธุรการ ออกเลขหนังสือส่งภายนอก', 6, '10-3v-35-legal-admin-dispatch2.html', 'admin_legal', 'L9A', 'L9A_PENDING_DOC_NO', 'L9A_PENDING_LAWYER_SEND') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0160B', 'นิติกร ส่งหนังสือและคำอุทธรณ์ไปยังสำนักงานคดีปกครอง', 7, '10-3v-36-lawyer-send-appeal2.html', 'case_legal_officer', 'L9A', 'L9A_PENDING_LAWYER_SEND', 'L9A_SENT_TO_PROSECUTOR') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L9B_INTAKE', 'ธุรการ รับหนังสือแจ้งมติบอร์ดเห็นชอบไม่อุทธรณ์', 0, '10-3v-37-legal-admin-no-appeal-intake.html', 'admin_legal', 'L9B', 'L9_BOARD_APPROVED_NO_APPEAL', 'L9B_PENDING_DIRECTOR_ASSIGN1') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L9B_DIRECTOR_ASSIGN1', 'ผอ.กองกฎหมาย พิจารณาและมอบหมายงาน', 1, '10-3v-38-legal-director-assign3.html', 'dir_legal', 'L9B', 'L9B_PENDING_DIRECTOR_ASSIGN1', 'L9B_PENDING_GROUP_ASSIGN1') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('L9B_GROUP_ASSIGN1', 'ผอ.กลุ่มงานคดี พิจารณาและมอบหมายนิติกรดำเนินการ', 2, '10-3v-39-group-director-assign3.html', 'case_group_director', 'L9B', 'L9B_PENDING_GROUP_ASSIGN1', 'L9B_PENDING_LAWYER_INTAKE') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0164_0167', 'นิติกร รับเรื่องและจัดทำหนังสือส่งภายนอกถึงอัยการ', 3, '10-3v-40-lawyer-no-appeal-intake.html', 'case_legal_officer', 'L9B', 'L9B_PENDING_LAWYER_INTAKE', 'L9B_PENDING_GROUP_REVIEW') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0168', 'ผอ.กลุ่มงานคดี ตรวจสอบหนังสือ', 4, '10-3v-45-group-director-review3.html', 'case_group_director', 'L9B', 'L9B_PENDING_GROUP_REVIEW', 'L9B_PENDING_DIRECTOR_SIGN') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0169', 'ผอ.กองกฎหมาย ลงนามในหนังสือที่ส่งถึงอัยการ', 5, '10-3v-46-legal-director-sign3.html', 'dir_legal', 'L9B', 'L9B_PENDING_DIRECTOR_SIGN', 'L9B_PENDING_DOC_NO') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0170', 'ธุรการ ออกเลขหนังสือ', 6, '10-3v-47-legal-admin-dispatch3.html', 'admin_legal', 'L9B', 'L9B_PENDING_DOC_NO', 'L9B_PENDING_LAWYER_SEND') on conflict do nothing;
insert into act103.step (code, label_th, seq, page, role, phase_code, entry_status_code, result_status_code) values ('LAW0171_0163', 'นิติกร ส่งหนังสือแจ้งความประสงค์ไม่อุทธรณ์ และปิดสำนวน', 7, '10-3v-48-lawyer-send-close.html', 'case_legal_officer', 'L9B', 'L9B_PENDING_LAWYER_SEND', 'L9B_CLOSED') on conflict do nothing;

-- seed act103.status
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_DIRECTOR_ASSIGN', 'ธุรการกองกฎหมาย รับเรื่องและเสนอ ผอ.กองกฎหมาย', 'LAW0085', '02-board-intake.html', 'admin_legal', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_GROUP_ASSIGN', 'ผอ.กองกฎหมาย ลงนามมอบหมาย', 'LAW0088', '10-3-02-legal-director-assign.html', 'dir_legal', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_LAWYER_REVIEW', 'ผอ.กลุ่มงาน มอบหมายนิติกรผู้รับผิดชอบ', 'LAW0089', '10-3-03-group-director-assign.html', 'case_group_director', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_GROUP_APPROVE', 'นิติกร ตรวจสอบคำฟ้องและจัดทำบันทึกความเห็น', 'LAW0090', '10-3-04-lawyer-review-complaint.html', 'case_legal_officer', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_DIRECTOR_SIGN', 'ผอ.กลุ่มงาน พิจารณาและเห็นชอบ', 'LAW0093', '10-3-07-group-director-approve.html', 'case_group_director', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_ADMIN_DISPATCH', 'ผอ.กองกฎหมาย ตรวจสอบและลงนามผ่านเรื่อง', 'LAW0094', '10-3-08-legal-director-sign.html', 'dir_legal', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_READY_FOR_BOARD', 'ธุรการ ออกเลขส่งภายในและส่งมติเสนอบอร์ด', 'LAW0095', '10-3-09-legal-admin-dispatch.html', 'admin_legal', 'LAWSUIT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3B_PENDING_CHAIRMAN_SIGN', 'นิติกร จัดทำคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี', 'LAW0097', '10-3b-01-lawyer-draft-stay-objection.html', 'case_legal_officer', 'STAY_OBJECTION', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3B_PENDING_LAWYER_DISPATCH', 'ประธานกรรมการ ป.ป.ท. ลงนามคำชี้แจงคัดค้านคำขอทุเลาการบังคับคดี', 'LAW0098', '10-3b-02-chairman-sign-stay-objection.html', 'chairman', 'STAY_OBJECTION', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3B_CLOSED', 'นิติกร ส่งคำชี้แจงคัดค้านต่อศาลปกครอง', 'LAW0099', '10-3b-03-lawyer-dispatch-stay-objection.html', 'case_legal_officer', 'STAY_OBJECTION', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3B2_APPEAL_FILED', 'นิติกร รับคำวินิจฉัย/คำสั่งศาลปกครองเรื่องทุเลาการบังคับคดี', 'LAW0100_0101', '10-3b-04-lawyer-court-order-intake.html', 'case_legal_officer', 'STAY_OBJECTION', true) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_DIRECTOR_RESOLUTION_ASSIGN', 'ธุรการกองกฎหมาย รับเรื่องและแจ้งผลมติคณะกรรมการ ป.ป.ท.', 'L3-19', '10-3-10-legal-admin-resolution-notice.html', 'admin_legal', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_GROUP_RESOLUTION_APPROVE', 'ผอ.กองกฎหมาย พิจารณาผลมติและมอบหมายงาน', 'L3-20', '10-3-11-legal-director-assign-resolution.html', 'dir_legal', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_LAWYER_EXTENSION', 'ผอ.กลุ่มงานคดี พิจารณาและเห็นชอบผลมติ/ข้อสั่งการ', 'L3-21', '10-3-12-group-director-approve-resolution.html', 'case_group_director', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_GROUP_ANSWER_REVIEW', 'นิติกร ยื่นคำขอขยายเวลาต่อศาลและร่างคำให้การแก้คำฟ้อง', 'L3-22', '10-3-13-lawyer-request-extension.html', 'case_legal_officer', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_DIRECTOR_ANSWER_REVIEW', 'ผอ.กลุ่มงานคดี ตรวจสอบร่างคำให้การ', 'L3-24', '10-3-15-group-director-review-answer.html', 'case_group_director', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_ADMIN_ANSWER_INTERNAL_NO', 'ผอ.กองกฎหมาย ตรวจสอบร่างคำให้การแก้คำฟ้อง', 'L3-25', '10-3-16-legal-director-review-answer.html', 'dir_legal', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_SECGEN_COVER_SIGN', 'ธุรการกองกฎหมาย ออกเลขหนังสือส่งภายในและเสนอผู้ลงนาม', 'L3-26', '10-3-17-legal-admin-internal-dispatch-answer.html', 'admin_legal', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_REGISTRY_ANSWER_EXTERNAL_NO', 'เลขาธิการ ป.ป.ท. ตรวจคำให้การและลงนามหนังสือนำส่ง', 'L3-27A', '10-3-18-secgen-sign-cover-letter.html', 'secgen', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_CHAIRMAN_ANSWER_SIGN', 'สารบรรณกลาง ออกเลขหนังสือส่งออก', 'L3-28', '10-3-20-registry-issue-external-no.html', 'registry', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_ADMIN_COLLECT_ORIGINALS', 'ประธานกรรมการ ป.ป.ท. ลงนามในคำให้การแก้คำฟ้อง', 'L3-29', '10-3-21-chairman-sign-answer.html', 'chairman', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_LAWYER_COLLECT_DOCS', 'ธุรการกองกฎหมาย รวบรวมเอกสารฉบับจริงที่ลงนามครบถ้วนแล้ว', 'L3-30', '10-3-22-legal-admin-collect-originals.html', 'admin_legal', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_LAWYER_POST_TO_PROSECUTOR', 'นิติกร กลุ่มงานคดี รวบรวมร่างคำให้การและเอกสารที่เกี่ยวข้อง', 'L3-31', '10-3-23-lawyer-collect-documents.html', 'case_legal_officer', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_PENDING_LAWYER_TRACK_STATUS', 'นิติกรเจ้าของเรื่อง จัดส่งทางไปรษณีย์ไปยังสำนักงานคดีปกครอง', 'L3-32', '10-3-24-lawyer-post-to-prosecutor.html', 'case_legal_officer', 'ANSWER', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3_AWAITING_JUDGMENT', 'นิติกร ติดตามสถานะการจัดส่งและใบตอบรับ', 'L3-33', '10-3-25-lawyer-track-status.html', 'case_legal_officer', 'ANSWER', true) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_PENDING_DIRECTOR_ASSIGN', 'ธุรการ รับหนังสือแจ้งผลคำพิพากษาและลงทะเบียนคดีปกครอง', 'LAW0119', '10-3v-00-legal-admin-verdict-intake.html', 'admin_legal', 'VERDICT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_PENDING_GROUP_ASSIGN', 'ผอ.กองกฎหมาย แจกจ่าย/มอบหมาย (คำพิพากษา)', 'LAW0121', '10-3v-02-legal-director-assign.html', 'dir_legal', 'VERDICT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_PENDING_LAWYER_ANALYSIS', 'ผอ.กลุ่มงาน มอบหมายนิติกร (คำพิพากษา)', 'LAW0122', '10-3v-03-group-director-assign.html', 'case_group_director', 'VERDICT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_PENDING_GROUP_APPROVE', 'นิติกร ตรวจ/วิเคราะห์ผลคำพิพากษา', 'LAW0123', '10-3v-04-lawyer-verdict-analysis.html', 'case_legal_officer', 'VERDICT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_PENDING_DIRECTOR_DECIDE', 'ผอ.กลุ่มงาน พิจารณาและเห็นชอบ (คำพิพากษา)', 'LAW0126', '10-3v-05-group-director-approve.html', 'case_group_director', 'VERDICT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_DECIDED', 'ผอ.กองกฎหมาย กำหนดแนวทางดำเนินการ (คำพิพากษา)', 'LAW0127', '10-3v-06-legal-director-decide.html', 'dir_legal', 'VERDICT', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L3V_CLOSED', 'นิติกร ดำเนินการตามคำพิพากษา/ปิดสำนวน', 'LAW0163', '10-3v-07-lawyer-close-case.html', 'case_legal_officer', 'VERDICT', true) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_DIRECTOR_ASSIGN', 'ธุรการ รับหนังสือแจ้งคำสั่งศาลให้ทำคำแก้อุทธรณ์', 'LAW0131', '10-3v-08-legal-admin-appeal-intake.html', 'admin_legal', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_GROUP_ASSIGN', 'ผอ.กองกฎหมาย แจกจ่าย/มอบหมาย (คำแก้อุทธรณ์)', 'LAW0135', '10-3v-09-legal-director-assign.html', 'dir_legal', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_LAWYER_DRAFT', 'ผอ.กลุ่มงาน มอบหมายนิติกร (คำแก้อุทธรณ์)', 'L7ASSIGN', '10-3v-10-group-director-assign.html', 'case_group_director', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_GROUP_APPROVE', 'นิติกร ลงทะเบียนคดี/ตรวจสอบ/ร่างคำแก้อุทธรณ์', 'LAW0133', '10-3v-11-lawyer-draft-appeal-reply.html', 'case_legal_officer', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_DIRECTOR_SIGN', 'ผอ.กลุ่มงาน ตรวจร่างคำแก้อุทธรณ์และเห็นชอบ', 'LAW0134', '10-3v-12-group-director-approve.html', 'case_group_director', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_ADMIN_DISPATCH', 'ผอ.กองกฎหมาย พิจารณาและลงนามในคำแก้อุทธรณ์', 'LAW0139', '10-3v-13-legal-director-sign.html', 'dir_legal', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_PENDING_LAWYER_SEND', 'ธุรการ ออกเลขหนังสือส่งภายนอก', 'LAW0140', '10-3v-14-legal-admin-dispatch.html', 'admin_legal', 'L7', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L7_SENT_TO_PROSECUTOR', 'นิติกร ส่งหนังสือและคำแก้อุทธรณ์ไปสำนักงานคดีปกครอง', 'LAW0141', '10-3v-15-lawyer-send-appeal-reply.html', 'case_legal_officer', 'L7', true) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L8_PENDING_DIRECTOR_ASSIGN1', 'ธุรการ รับหนังสือแจ้งผลคำพิพากษาเพื่อพิจารณาอุทธรณ์', 'LAW0143', '10-3v-16-legal-admin-appeal-consider-intake.html', 'admin_legal', 'L8', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L8_PENDING_GROUP_ASSIGN1', 'ผอ.กองกฎหมาย มอบหมาย ผอ.กลุ่มงานคดี (ลงทะเบียนคดี)', 'L8ASSIGN1', '10-3v-17-legal-director-assign1.html', 'dir_legal', 'L8', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L8_PENDING_LAWYER_REGISTER', 'ผอ.กลุ่มงาน มอบหมายนิติกร (ลงทะเบียนคดี)', 'L8GROUPASSIGN1', '10-3v-18-group-director-assign1.html', 'case_group_director', 'L8', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L8_PENDING_GROUP_APPROVE1', 'นิติกร ลงทะเบียนคดี/ตรวจสอบคำพิพากษา/เสนอความเห็นควรอุทธรณ์', 'LAW0145', '10-3v-19-lawyer-register.html', 'case_legal_officer', 'L8', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L8_DECIDED', 'ผอ.กลุ่มงาน พิจารณาและยืนยันความเห็นควรอุทธรณ์', 'LAW0146', '10-3v-20-group-director-approve1.html', 'case_group_director', 'L8', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L10_PENDING_DIRECTOR_SIGN', 'ผอ.กลุ่มงาน ตรวจร่างคำอุทธรณ์', 'LAW0157', '10-3v-22-group-director-review-appeal.html', 'case_group_director', 'L10', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L10_PENDING_DOC_NO', 'ผอ.กองกฎหมาย พิจารณาและลงนามคำอุทธรณ์/หนังสือถึงสำนักงานคดีปกครอง', 'LAW0158', '10-3v-23-legal-director-sign-appeal.html', 'dir_legal', 'L10', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L10_PENDING_LAWYER_SEND', 'ธุรการ ออกเลขหนังสือส่งภายนอก', 'LAW0159', '10-3v-24-legal-admin-dispatch.html', 'admin_legal', 'L10', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L10_SENT_TO_PROSECUTOR', 'นิติกร ส่งหนังสือและคำอุทธรณ์ไปยังสำนักงานคดีปกครอง', 'LAW0160', '10-3v-25-lawyer-send-appeal.html', 'case_legal_officer', 'L10', true) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9_PENDING_DIRECTOR_APPROVE', 'ผอ.กลุ่มงาน พิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)', 'LAW0150', '10-3v-26-group-director-board-approve.html', 'case_group_director', 'L9', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9_PENDING_DOC_SEND', 'ผอ.กองกฎหมาย พิจารณาและลงนามเห็นชอบ (เสนอมติบอร์ด)', 'LAW0151', '10-3v-27-legal-director-board-approve.html', 'dir_legal', 'L9', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9_PROPOSED_TO_BOARD', 'ธุรการ ส่งมติเสนอบอร์ด', 'LAW0152', '10-3v-28-legal-admin-board-propose.html', 'admin_legal', 'L9', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_DIRECTOR_ASSIGN', 'ธุรการ รับหนังสือแจ้งมติบอร์ดเห็นชอบให้อุทธรณ์', 'L9A_INTAKE', '10-3v-29-legal-admin-board-appeal-intake.html', 'admin_legal', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_GROUP_APPROVE', 'ผอ.กองกฎหมาย พิจารณาและมอบหมายงาน', 'LAW0155', '10-3v-30-legal-director-assign2.html', 'dir_legal', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_LAWYER_DRAFT', 'ผอ.กลุ่มงานคดี พิจารณาเห็นชอบและมอบหมายนิติกรดำเนินการ', 'LAW0154', '10-3v-31-group-director-assign2.html', 'case_group_director', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_GROUP_REVIEW', 'นิติกร รับเรื่องเพื่อดำเนินการแจ้งผล และร่างคำอุทธรณ์', 'LAW0153_0156', '10-3v-32-lawyer-draft-appeal2.html', 'case_legal_officer', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_DIRECTOR_SIGN', 'ผอ.กลุ่มงาน ตรวจร่างคำอุทธรณ์', 'LAW0157B', '10-3v-33-group-director-review-appeal2.html', 'case_group_director', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_DOC_NO', 'ผอ.กองกฎหมาย พิจารณาและลงนามคำอุทธรณ์/หนังสือถึงสำนักงานคดีปกครอง', 'LAW0158B', '10-3v-34-legal-director-sign-appeal2.html', 'dir_legal', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_PENDING_LAWYER_SEND', 'ธุรการ ออกเลขหนังสือส่งภายนอก', 'LAW0159B', '10-3v-35-legal-admin-dispatch2.html', 'admin_legal', 'L9A', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9A_SENT_TO_PROSECUTOR', 'นิติกร ส่งหนังสือและคำอุทธรณ์ไปยังสำนักงานคดีปกครอง', 'LAW0160B', '10-3v-36-lawyer-send-appeal2.html', 'case_legal_officer', 'L9A', true) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_DIRECTOR_ASSIGN1', 'ธุรการ รับหนังสือแจ้งมติบอร์ดเห็นชอบไม่อุทธรณ์', 'L9B_INTAKE', '10-3v-37-legal-admin-no-appeal-intake.html', 'admin_legal', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_GROUP_ASSIGN1', 'ผอ.กองกฎหมาย พิจารณาและมอบหมายงาน', 'L9B_DIRECTOR_ASSIGN1', '10-3v-38-legal-director-assign3.html', 'dir_legal', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_LAWYER_INTAKE', 'ผอ.กลุ่มงานคดี พิจารณาและมอบหมายนิติกรดำเนินการ', 'L9B_GROUP_ASSIGN1', '10-3v-39-group-director-assign3.html', 'case_group_director', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_GROUP_REVIEW', 'นิติกร รับเรื่องและจัดทำหนังสือส่งภายนอกถึงอัยการ', 'LAW0164_0167', '10-3v-40-lawyer-no-appeal-intake.html', 'case_legal_officer', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_DIRECTOR_SIGN', 'ผอ.กลุ่มงานคดี ตรวจสอบหนังสือ', 'LAW0168', '10-3v-45-group-director-review3.html', 'case_group_director', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_DOC_NO', 'ผอ.กองกฎหมาย ลงนามในหนังสือที่ส่งถึงอัยการ', 'LAW0169', '10-3v-46-legal-director-sign3.html', 'dir_legal', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_PENDING_LAWYER_SEND', 'ธุรการ ออกเลขหนังสือ', 'LAW0170', '10-3v-47-legal-admin-dispatch3.html', 'admin_legal', 'L9B', false) on conflict do nothing;
insert into act103.status (code, label_th, step_code, page, role, phase_code, is_terminal) values ('L9B_CLOSED', 'นิติกร ส่งหนังสือแจ้งความประสงค์ไม่อุทธรณ์ และปิดสำนวน', 'LAW0171_0163', '10-3v-48-lawyer-send-close.html', 'case_legal_officer', 'L9B', true) on conflict do nothing;
