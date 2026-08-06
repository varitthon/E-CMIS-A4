/**
 * E-CMIS Activity 10: Legal Case Management Logic & Mock State Engine
 */

// Mock Datastore for Activity 10 Cases
const ECMIS_A10_DATA = {
  cases: [
    {
      id: "คดี-10.1-2569/001",
      title: "พิจารณาความเห็นแย้งคำสั่งไม่ฟ้องคดีทุจริตจัดซื้อจัดจ้างโครงการปรับปรุงอาคาร",
      category: "10.1",
      categoryName: "คดีชั้นอัยการ (ความเห็นแย้ง)",
      source: "สำนักงานอัยการพิเศษฝ่ายคดีปราบปรามการทุจริต",
      officer: "นายณัฐพล บัวทุม (นิติกรชำนาญการ)",
      status: "กำลังร่างความเห็นแย้ง",
      statusBadge: "bg-warning text-dark",
      slaDays: 7,
      slaDaysRemaining: 3,
      slaAlert: "sla-warning",
      dateReceived: "2026-08-01",
      dueDate: "2026-08-08",
      workflowStep: 2, // 1: ธุรการ, 2: นิติกร, 3: ผอ.กอง, 4: เลขาธิการ, 5: ส่ง อสส.
      documents: [
        { name: "คำสั่งไม่ฟ้องเด็ดขาดจากพนักงานอัยการ.pdf", type: "pdf", size: "2.4 MB" },
        { name: "รายงานการไต่สวนข้อเท็จจริง (กจ.7).pdf", type: "pdf", size: "8.1 MB" }
      ]
    },
    {
      id: "คำร้อง-10.2-2569/014",
      title: "คำร้องขอเปิดเผยข้อมูลข่าวสารรายงานการไต่สวนคดีบริหารงานผิดพลาด",
      category: "10.2.1",
      categoryName: "คำร้องขอเปิดเผยข้อมูลข่าวสาร",
      source: "ศูนย์รับเรื่องร้องเรียน (Walk-in)",
      officer: "นางสาวนิติพร มีไพฑูรย์ (นิติกรชำนาญการ)",
      status: "รอคณะอนุกรรมการฯ พิจารณา",
      statusBadge: "bg-info text-dark",
      slaDays: 60,
      slaDaysRemaining: 22, // ครึ่งทาง 30 วัน
      slaAlert: "sla-normal",
      dateReceived: "2026-07-15",
      dueDate: "2026-09-13",
      workflowStep: 3,
      documents: [
        { name: "หนังสือคำร้องขอเปิดเผยข้อมูลข่าวสาร.pdf", type: "pdf", size: "1.1 MB" }
      ]
    },
    {
      id: "อุทธรณ์-10.2-2569/005",
      title: "คำอุทธรณ์การไม่เปิดเผยข้อมูลข่าวสารเกี่ยวกับการสอบวินัยข้าราชการ",
      category: "10.2.2",
      categoryName: "คำอุทธรณ์การไม่เปิดเผยข้อมูล",
      source: "ระบบรับเรื่องร้องเรียนออนไลน์ (Email)",
      officer: "นายปติคุณ อู่ตะเภา (นิติกรชำนาญการ)",
      status: "เสนอ ผอ.กองกฎหมาย",
      statusBadge: "bg-primary text-white",
      slaDays: 60,
      slaDaysRemaining: 8, // ใกล้ครบกำหนด 45/60 วัน
      slaAlert: "sla-danger",
      dateReceived: "2026-06-20",
      dueDate: "2026-08-19",
      workflowStep: 3,
      documents: [
        { name: "หนังสือคำอุทธรณ์ของผู้ร้อง.pdf", type: "pdf", size: "3.5 MB" }
      ]
    },
    {
      id: "คดีปกครอง-10.3-2569/002",
      title: "คดีปกครองหมายเลขดำที่ อ.145/2569 ศาลปกครองสูงสุดออกหมายเรียกให้ทำคำให้การเพิ่มเติม",
      category: "10.3",
      categoryName: "คดีปกครอง (ศาลปกครอง)",
      source: "ศาลปกครองสูงสุด (e-Court)",
      officer: "นายอานนท์ ชนประชา (นิติกรชำนาญการพิเศษ)",
      status: "รอลงนามอนุมัติร่างคำให้การ",
      statusBadge: "bg-success text-white",
      slaDays: 30,
      slaDaysRemaining: 5,
      slaAlert: "sla-danger",
      dateReceived: "2026-07-20",
      dueDate: "2026-08-19",
      workflowStep: 4,
      documents: [
        { name: "หมายเรียกและสำเนาคำฟ้องศาลปกครองสูงสุด.pdf", type: "pdf", size: "5.7 MB" },
        { name: "ร่างคำให้การเพิ่มเติมต่อศาลปกครอง.docx", type: "docx", size: "450 KB" }
      ]
    }
  ],
  
  roles: [
    { id: "admin_legal", name: "ธุรการกองกฎหมาย", badge: "ธุรการ" },
    { id: "legal_officer", name: "นิติกรเจ้าของสำนวน", badge: "นิติกร" },
    { id: "dir_legal", name: "ผู้อำนวยการกองกฎหมาย", badge: "ผอ.กอง" },
    { id: "sec_gen", name: "เลขาธิการ ป.ป.ท. / รองเลขาธิการ", badge: "เลขาธิการ" }
  ],
  
  currentRole: "legal_officer"
};

// Initialize App Scripts
document.addEventListener("DOMContentLoaded", function () {
  console.log("E-CMIS Activity 10 App Initialized");
  renderRoleSwitcher();
});

// Render Role Switcher UI
function renderRoleSwitcher() {
  const container = document.getElementById("roleSwitcherContainer");
  if (!container) return;
  
  let html = `
    <div class="dropdown">
      <button class="role-switcher-badge dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fa-solid fa-user-shield"></i>
        <span>สวมบทบาท: ${getRoleName(ECMIS_A10_DATA.currentRole)}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow">
        <li><h6 class="dropdown-header">เลือกบทบาทปฏิบัติงาน</h6></li>
  `;
  
  ECMIS_A10_DATA.roles.forEach(r => {
    const activeClass = r.id === ECMIS_A10_DATA.currentRole ? 'active' : '';
    html += `
      <li>
        <a class="dropdown-item ${activeClass}" href="#" onclick="switchRole('${r.id}')">
          <span class="badge bg-secondary me-2">${r.badge}</span>${r.name}
        </a>
      </li>
    `;
  });
  
  html += `</ul></div>`;
  container.innerHTML = html;
}

function getRoleName(roleId) {
  const role = ECMIS_A10_DATA.roles.find(r => r.id === roleId);
  return role ? role.name : roleId;
}

function switchRole(roleId) {
  ECMIS_A10_DATA.currentRole = roleId;
  renderRoleSwitcher();
  
  Swal.fire({
    icon: 'success',
    title: 'สลับบทบาทเรียบร้อย',
    text: `ปัจจุบันคุณกำลังสวมบทบาท: ${getRoleName(roleId)}`,
    timer: 1500,
    showConfirmButton: false
  });
  
  if (typeof refreshCurrentPage === 'function') {
    refreshCurrentPage();
  }
}

// Digital Signature Canvas Simulator
function initSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let drawing = false;
  
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  
  canvas.addEventListener('mousedown', e => { drawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
  canvas.addEventListener('mousemove', e => { if (drawing) { ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); } });
  canvas.addEventListener('mouseup', () => { drawing = false; });
  canvas.addEventListener('mouseleave', () => { drawing = false; });
}

function clearSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
