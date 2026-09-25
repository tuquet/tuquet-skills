# 🎯 tuquet-skills

> **Enterprise AI Coding Agent Tooling & Skillsets**  
> Bộ sưu tập kỹ năng (Skills), runbooks tự động hóa và giải pháp tối ưu hóa hạ tầng dành cho AI Coding Agents (Google Antigravity, Claude Code, Cursor, Codex).

---

## 💎 Giá trị Doanh nghiệp (Enterprise Business Value)

Các giải pháp trong kho lưu trữ này được thiết kế theo các nguyên tắc kỹ nghệ phần mềm cốt lõi: **ROI cao**, **Zero-Touch Automation**, **Bảo mật sandbox**, và triết lý **KISS & YAGNI** (Keep It Simple, Stupid & You Aren't Gonna Need It):

1. **Tối ưu hóa Chi phí Vận hành (Cost Reduction & Infinite Quota)**:
   - Cắt giảm 100% chi phí token API trực tiếp cho các công cụ coding agent bằng cách tận dụng hạn ngạch Google Antigravity OAuth có sẵn của doanh nghiệp.
   - Giúp các nhóm kỹ sư tiết kiệm từ hàng trăm đến hàng ngàn USD mỗi tháng mà vẫn được trải nghiệm sức mạnh của các mô hình hàng đầu (Claude 3.7 Sonnet, Opus 4.6 Thinking, Gemini 3.8 Flash).

2. **Tiết kiệm Tài nguyên Hệ thống (Zero RAM Leakage)**:
   - Cơ chế **On-Demand Proxy Lifecycle**: Reverse proxy chỉ khởi chạy khi kỹ sư bắt đầu phiên làm việc và **tự động giải phóng hoàn toàn** khi thoát (`0MB RAM idle lingering`). Không cần duy trì background daemon thường trực tốn RAM.

3. **Sẵn sàng cho CI/CD & Headless Container**:
   - Vượt qua các rào cản phân quyền root và hộp thoại xác nhận tương tác (`IS_SANDBOX=1` + `bypassPermissionsModeAccepted`), cho phép agent vận hành tự động trong Docker, GitHub Actions runner, Kubernetes pod hoặc máy chủ Linux headless.

4. **Triển khai Đa Nền tảng Chuẩn hóa (Cross-Platform Zero-Touch)**:
   - Cài đặt 1 lệnh duy nhất cho cả máy chủ **Linux** và máy trạm **Windows 10/11** mới tinh.
   - Tự động cấu hình môi trường, tải binary, đồng bộ token và phơi command ra hệ thống toàn cục.

---

## 📚 Danh mục Skills (Catalog)

| Skill | Giá trị Doanh nghiệp & Tính năng Kỹ thuật | Nền tảng | Trạng thái |
| :--- | :--- | :---: | :---: |
| [**`claude-antigravity`**](./skills/claude-antigravity/SKILL.md) | **Cầu nối Claude Code CLI với Google Antigravity OAuth (`claude-agy`)**:<br>• Tiết kiệm chi phí API bằng Google Antigravity OAuth.<br>• Tự động bypass root permissions & trust dialog.<br>• Bộ lọc chống mã lỗi 429 quota từ Google Cloud.<br>• Quản lý vòng đời proxy thông minh (auto-kill khi thoát session).<br>• Tự động khám phá mô hình qua lệnh `/model` (chuẩn KISS & YAGNI). | 🐧 Linux<br>🪟 Windows 10/11 | ✅ Production Ready |

---

## 🚀 Hướng dẫn Cài đặt Nhanh (1-Click Setup)

### 🌟 Cách Tối Ưu Nhất: Universal 1-File Setup (Đa Nền Tảng: Windows, Linux, macOS)
Do Claude Code CLI yêu cầu **Node.js (>= 18)**, bạn có thể cài đặt bằng **1 file JavaScript duy nhất** không phân biệt hệ điều hành:

```bash
# Chạy trực tiếp từ repo vừa clone
node skills/claude-antigravity/scripts/setup.mjs
```

Hoặc cài đặt 1 lệnh trực tiếp qua mạng:
```bash
# Chạy được trên cả Windows (PowerShell/CMD), Linux, macOS
curl -fsSL https://raw.githubusercontent.com/tuquet/tuquet-skills/main/skills/claude-antigravity/scripts/setup.mjs | node
```

---

### 🪟 Dành cho Windows (Qua Scoop - Khuyên Dùng Cho Developer)
Nếu bạn sử dụng [Scoop](https://scoop.sh), đây là phương pháp chuẩn hóa, cách ly và tiện lợi nhất:

```powershell
# 1. Thêm Tuquet Scoop Bucket
scoop bucket add tuquet https://github.com/tuquet/tuquet-scoop-bucket

# 2. Cài đặt Claude-Agy
scoop install claude-agy
```
*Tự động cài đặt dependency Node.js LTS, cấu hình shims, bypass trust dialog, persist token & config qua các lần cập nhật (`scoop update claude-agy`).*

---

### 🪟 Dành cho Windows (PowerShell Script Trực Tiếp)
Mở **PowerShell** và dán lệnh:
```powershell
irm https://raw.githubusercontent.com/tuquet/tuquet-skills/main/skills/claude-antigravity/scripts/setup.ps1 | iex
```

### 🐧 Dành cho Linux / Ubuntu / Debian / WSL
Mở terminal và dán lệnh:
```bash
curl -fsSL https://raw.githubusercontent.com/tuquet/tuquet-skills/main/skills/claude-antigravity/scripts/setup.sh | bash
```

---

## 🔌 Tích hợp vào Google Antigravity (Global Skills)

Để trợ lý AI Antigravity tự động nhận diện và sử dụng kỹ năng `claude-antigravity` trong mọi phiên làm việc:

```bash
mkdir -p ~/.gemini/config/skills
ln -sf /root/tuquet-skills/skills/claude-antigravity ~/.gemini/config/skills/claude-antigravity
```

---

## 💡 Triết lý Thiết kế: KISS & YAGNI

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **KISS** (Keep It Simple, Stupid) và **YAGNI** (You Aren't Gonna Need It):
- **Không cấu hình alias dư thừa**: Không tạo danh sách hàng chục alias ảo gây rối cấu hình.
- **Model Discovery tự nhiên**: Khi gõ `claude-agy`, kỹ sư chỉ cần gõ `/model` để xem và chuyển đổi trực quan giữa toàn bộ các model upstream do Google Antigravity cung cấp.
- **Tập trung vào tính ổn định**: Cấu hình tối giản, chỉ giữ lại các tham số thực sự cần thiết (cổng proxy, lọc từ nhạy cảm chống lỗi 429, thư mục auth).

---

## 🛠️ Đóng góp thêm Skill mới

Cấu trúc chuẩn của một skill:
```text
skills/<skill-name>/
├── SKILL.md          # Hướng dẫn chính kèm YAML frontmatter (name, description)
├── scripts/          # Script tự động hóa (setup.sh, setup.ps1, uninstaller)
├── references/       # Tài liệu kiến trúc, specs chi tiết
└── examples/         # Ví dụ mẫu
```

---

## 📄 License
MIT © [tuquet](https://github.com/tuquet)
