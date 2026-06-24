import pandas as pd
import json
import math

file_path = '/Users/buiminhkhoi/Documents/Antigravity/ICD-10/Phu luc Bang danh muc ICD10_FINAL .xlsx'
output_path = '/Users/buiminhkhoi/Documents/Antigravity/ICD-10/icd10_flat.json'

print("Đang đọc file Excel...")
# Đọc file, bỏ qua dòng title (dòng 0), dòng 1 là header chính thức
df = pd.read_excel(file_path, skiprows=1)

def clean_val(val):
    if pd.isna(val):
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if isinstance(val, str):
        val = val.strip()
        if val == "":
            return None
    return val

records = []
print("Đang parse dữ liệu...")
for index, row in df.iterrows():
    # Bỏ qua dòng số thứ tự cột (dòng có STT=1, cột 2=2...)
    if str(row.iloc[0]).strip() == '1' and str(row.iloc[1]).strip() == '2':
        continue
    
    stt = clean_val(row.iloc[0])
    if stt is None:
        continue # Dòng trống
    
    record = {
        "stt": stt,
        "chuong": {
            "stt": clean_val(row.iloc[1]),
            "phamViMa": clean_val(row.iloc[2]),
            "tenTiengAnh": clean_val(row.iloc[3]),
            "tenTiengViet": clean_val(row.iloc[4])
        },
        "khoi": {
            "ma": clean_val(row.iloc[5]),
            "tenTiengAnh": clean_val(row.iloc[6]),
            "tenTiengViet": clean_val(row.iloc[7])
        },
        "tieuKhoiCap1": {
            "ma": clean_val(row.iloc[8]),
            "tenTiengAnh": clean_val(row.iloc[9]),
            "tenTiengViet": clean_val(row.iloc[10])
        },
        "tieuKhoiCap2": {
            "ma": clean_val(row.iloc[11]),
            "tenTiengAnh": clean_val(row.iloc[12]),
            "tenTiengViet": clean_val(row.iloc[13])
        },
        "nhomBenh3KyTu": {
            "ma": clean_val(row.iloc[14]),
            "tenTiengAnh": clean_val(row.iloc[15]),
            "tenTiengViet": clean_val(row.iloc[16])
        },
        "benh": {
            "maBenh": clean_val(row.iloc[17]),
            "maBenhKhongDau": clean_val(row.iloc[18]),
            "tenTiengAnh": clean_val(row.iloc[19]),
            "huongDanMaHoaTiengAnh": clean_val(row.iloc[20]),
            "tenTiengViet": clean_val(row.iloc[21]),
            "huongDanMaHoaTiengViet": clean_val(row.iloc[22]),
            "dieuKienSuDung": {
                "khongDungLaBenhChinh": clean_val(row.iloc[23]),
                "khongKhuyenKhichDungLaBenhChinh": clean_val(row.iloc[24]),
                "khongSuDungViCoMaCuTheHon": clean_val(row.iloc[25]),
                "chiSuDungMaHoaNguyenNhanTuVong": clean_val(row.iloc[26]),
                "chiCoONuGioi": clean_val(row.iloc[27]),
                "chiCoONamGioi": clean_val(row.iloc[28])
            }
        }
    }
    
    # Fill down missing values cho Chương và Khối nếu ở dạng gộp ô (merged cells)
    # Trong file Excel chuẩn, đôi khi các ô bị merge nên khi đọc pandas sẽ ra NaN cho các dòng sau
    # Cấu trúc flat array yêu cầu mỗi dòng phải có đủ context.
    # Ta sẽ xử lý việc fill-down (kế thừa context từ record liền trước)
    if records:
        prev = records[-1]
        
        # Nếu chương trống, kế thừa từ dòng trước
        if record["chuong"]["stt"] is None:
            record["chuong"] = prev["chuong"]
            
        # Nếu khối trống, kế thừa từ dòng trước
        if record["khoi"]["ma"] is None:
            record["khoi"] = prev["khoi"]
            
        # Nếu nhóm bệnh 3 ký tự trống, kế thừa từ dòng trước (tùy vào logic dữ liệu, thông thường nhóm 3 ký tự có thể lặp lại hoặc để trống khi mã con chi tiết)
        if record["nhomBenh3KyTu"]["ma"] is None:
            record["nhomBenh3KyTu"] = prev["nhomBenh3KyTu"]
            
    records.append(record)

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print(f"Thành công! Đã chuyển đổi {len(records)} bản ghi vào {output_path}")
