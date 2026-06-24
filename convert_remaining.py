import pandas as pd
import json
import math

# Danh sách các file còn lại và dòng bắt đầu header (0-indexed so với file thực tế, hoặc số dòng cần bỏ qua)
# PL3: Bỏ qua 1 dòng tiêu đề
# PL4: Bỏ qua 0 dòng (hoặc 1 dòng tiêu đề tùy format, nhìn log thì header nằm ở index 0)
# PL5: Header cũng nằm ở index 0 của DataFrame khi load default
files = [
    ('260619_PL3_Danh muc thuoc va hoa chat ho tro ma hoa.xlsx', 1),
    ('260622_PL4_Danh muc ma benh bi huy so voi QD4469.xlsx', 0),
    ('260622_PL5_Danh muc ma benh bo sung so voi QD4469.xlsx', 0)
]

for file, skip in files:
    print(f"Đang xử lý {file}...")
    try:
        df = pd.read_excel(file, skiprows=skip)
        
        # Xóa các dòng trống hoàn toàn
        df.dropna(how='all', inplace=True)
        
        # Làm sạch tên cột
        df.columns = [str(c).strip().replace('\n', ' ') for c in df.columns]
        
        # Lọc bỏ các dòng mà cột STT là chữ 'STT' hoặc số 1,2,3 (phần header phụ)
        # Tương tự như file chính
        if 'STT' in df.columns:
            df = df[df['STT'].astype(str).str.strip() != 'STT']
            df = df[~df['STT'].astype(str).str.contains('STT CHƯƠNG', na=False, case=False)]
        
        # Chuyển đổi NaN thành None để parse ra null trong JSON
        records = df.where(pd.notnull(df), None).to_dict(orient='records')
        
        out_file = file.replace('.xlsx', '.json')
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        print(f" -> Đã xuất {out_file} ({len(records)} bản ghi)")
    except Exception as e:
        print(f"Lỗi khi xử lý {file}: {e}")
