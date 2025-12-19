# 🧪 Test Cases - File Result Feature

## Test Suite: View File from History

### Test Case 1: تحميل ملف موجود
**Precondition:**
- User logged in
- ملف موجود في History مع output file

**Steps:**
1. اذهب لصفحة History `/history`
2. اضغط زر "View Result" على أحد الملفات

**Expected Result:**
- ✅ console log: "📥 Loading file from history: {...}"
- ✅ console log: "🔍 getOutputFileBase64 called with: {...}"
- ✅ console log: "📦 API Response: {...}"
- ✅ البيانات تتخزن في localStorage
- ✅ الصفحة تنتقل إلى `/file-result`
- ✅ الجدول يظهر بالبيانات

**Pass/Fail:** ___

---

### Test Case 2: رسالة الخطأ 404
**Precondition:**
- User logged in
- ملف موجود لكن لم يتم معالجته بعد (لا يوجد output)

**Steps:**
1. اذهب لصفحة History
2. اضغط "View Result" على ملف بدون output

**Expected Result:**
- ✅ console log: "❌ Error loading file: HttpErrorResponse {...}"
- ✅ Alert يظهر:
  ```
  ⚠️ File Not Found
  
  The output file for this record does not exist.
  ...
  ```

**Pass/Fail:** ___

---

### Test Case 3: رسالة الخطأ - لا توجد بيانات
**Precondition:**
- API يرجع response بدون `fileBase64`

**Steps:**
1. اضغط "View Result"
2. API ترجع response فارغ أو `null`

**Expected Result:**
- ✅ Alert يظهر:
  ```
  ⚠️ File Processing Error
  
  The output file for this input has not been generated yet.
...
  ```

**Pass/Fail:** ___

---

## Test Suite: File Result Page

### Test Case 4: عرض الجدول بشكل صحيح
**Precondition:**
- البيانات تحملت بنجاح في `/file-result`

**Steps:**
1. شوف الجدول

**Expected Result:**
- ✅ Headers تظهر بشكل صحيح
- ✅ جميع الصفوف تظهر
- ✅ آخر صف = "Total" (Grand Total row)
- ✅ عمود Total يحتوي على قيم محسوبة

**Pass/Fail:** ___

---

### Test Case 5: حساب الـ Total تلقائي
**Precondition:**
- الجدول مفتوح

**Steps:**
1. شاهد الصفوف
2. تحقق من الحساب: Total = Column2 × Column4

**Example:**
```
Col1 │ Col2 │ Col3 │ Col4 │ Total
─────┼──────┼──────┼──────┼──────
  A  │  10  │  B   │  5   │  50   ← 10 × 5
  C  │  20  │  D   │  3   │  60   ← 20 × 3
─────┴──────┴──────┴──────┴──────
     │   │      │      │ 110  ← Sum
```

**Expected Result:**
- ✅ كل صف: Total = (Row × Column 2) × (Row × Column 4)
- ✅ صف Total: Grand Total = مجموع كل الـ Total

**Pass/Fail:** ___

---

## Test Suite: Edit Mode

### Test Case 6: الدخول لـ Edit Mode (Manager)
**Precondition:**
- User هو Manager (صاحب الملف)
- الجدول مفتوح

**Steps:**
1. اضغط زر [Edit]

**Expected Result:**
- ✅ جميع الخلايا (ما عدا Total) بتصير inputs
- ✅ يظهر زرار [Save] و [Cancel]
- ✅ الـ Grand Total row بيبقى read-only

**Pass/Fail:** ___

---

### Test Case 7: محاولة التعديل (Non-Manager)
**Precondition:**
- User ليس المدير الأصلي

**Steps:**
1. اضغط زر [Edit]

**Expected Result:**
- ✅ Alert يظهر:
  ```
  You don't have permission to edit this file.
  ```
- ✅ وضعية Edit لا تفعل

**Pass/Fail:** ___

---

### Test Case 8: تعديل القيم و إعادة حساب التوتال
**Precondition:**
- في وضعية Edit
- المستخدم هو Manager

**Steps:**
1. عدّل قيمة في Column 2 (مثل من 10 إلى 15)
2. شاهد الـ Total للصف ده

**Expected Result:**
- ✅ الـ Total يتحدّث تلقائي
- ✅ الـ Grand Total يتحدّث
- ✅ لا حاجة لضغط Save مبدئياً

**Example:**
```
قبل:  10 × 5 = 50 
بعد:  15 × 5 = 75 ← تلقائي
```

**Pass/Fail:** ___

---

### Test Case 9: حفظ التعديلات
**Precondition:**
- في وضعية Edit
- عملت تعديلات
- اضغط [Save]

**Steps:**
1. لما اضغط Save

**Expected Result:**
- ✅ console log: "💾 Saving edit with: {...}"
- ✅ Data يروح للـ API
- ✅ Alert: "Changes saved successfully"
- ✅ الصفحة تعود للعرض العادي
- ✅ البيانات الجديدة تظهر

**Pass/Fail:** ___

---

### Test Case 10: إلغاء التعديلات
**Precondition:**
- في وضعية Edit
- عملت تعديلات
- اضغط [Cancel]

**Steps:**
1. لما اضغط Cancel

**Expected Result:**
- ✅ جميع التعديلات تنحذف
- ✅ البيانات الأصلية ترجع
- ✅ خروج من Edit mode
- ✅ لا alerts

**Pass/Fail:** ___

---

## Test Suite: Download

### Test Case 11: تحميل Output File
**Precondition:**
- البيانات مفتوحة

**Steps:**
1. اضغط [Download Output]

**Expected Result:**
- ✅ ملف CSV يتحمّل
- ✅ اسم الملف: `{fileName}_output.csv`
- ✅ المحتوى: البيانات الحالية (بدون Grand Total)

**Pass/Fail:** ___

---

### Test Case 12: تحميل All Files (ZIP)
**Precondition:**
- البيانات مفتوحة

**Steps:**
1. اضغط [Download All]

**Expected Result:**
- ✅ ملف ZIP يتحمّل
- ✅ اسم الملف: `{fileName}_all_files.zip`
- ✅ المحتوى: Input file + Output file

**Pass/Fail:** ___

---

## Test Suite: Navigation

### Test Case 13: الذهاب للـ Upload صفحة
**Precondition:**
- في صفحة File Result

**Steps:**
1. اضغط [Go Back to Upload] أو [Upload]

**Expected Result:**
- ✅ الصفحة تنتقل إلى `/upload`

**Pass/Fail:** ___

---

### Test Case 14: الذهاب للـ Home
**Precondition:**
- في صفحة File Result

**Steps:**
1. اضغط [Home] أو [Go Home]

**Expected Result:**
- ✅ الصفحة تنتقل إلى `/`

**Pass/Fail:** ___

---

## Test Suite: Browser Console

### Test Case 15: التحقق من الـ Logs
**Steps:**
1. افتح Browser Developer Tools (F12)
2. اذهب لـ Console tab
3. نفّذ العمليات من أعلى

**Expected Result:**
- ✅ جميع الـ logs تظهر بوضوح:
  ```
  📥 Loading file from history: {...}
  🔍 getOutputFileBase64 called with: {...}
  📂 Loaded from localStorage: {...}
  ✅ File data saved to localStorage: {...}
  💾 Saving edit with: {...}
  ✅ Save successful: {...}
  ```
- ✅ لا errors في console

**Pass/Fail:** ___

---

## Test Suite: Network Requests

### Test Case 16: التحقق من الـ API Calls
**Steps:**
1. افتح Browser Developer Tools (F12)
2. اذهب لـ Network tab
3. اضغط "View Result"

**Expected Result:**
- ✅ Request يظهر:
  ```
  GET /api/history/output/base64?userId=...&projectName=...&fileName=...
  Status: 200 ✅
  Response: { fileBase64: "..." }
  ```

**Pass/Fail:** ___

---

### Test Case 17: حفظ التعديلات - Network
**Steps:**
1. في Network tab
2. اضغط [Save]

**Expected Result:**
- ✅ Request يظهر:
  ```
  POST /api/WorkerOn/editoutputfile
  Status: 200 ✅
  Response: { message: "Output file updated successfully." }
  ```

**Pass/Fail:** ___

---

## Performance Tests

### Test Case 18: سرعة التحميل
**Precondition:**
- ملف متوسط الحجم (5-10 صفوف)

**Steps:**
1. اضغط "View Result"
2. قس الوقت من البداية لما يظهر الجدول

**Expected Result:**
- ✅ الجدول يظهر في أقل من 2 ثانية
- ✅ لا freeze في الـ UI

**Pass/Fail:** ___

---

### Test Case 19: تحرير ملف كبير
**Precondition:**
- ملف كبير (100+ صفوف)

**Steps:**
1. ادخل Edit mode
2. عدّل عدة قيم
3. اضغط Save

**Expected Result:**
- ✅ التعديلات تطبّق بدون تأخير
- ✅ الـ UI بيبقى responsive

**Pass/Fail:** ___

---

## Edge Cases

### Test Case 20: ملف بدون data
**Precondition:**
- الملف موجود لكن CSV فارغ

**Steps:**
1. اضغط "View Result"

**Expected Result:**
- ✅ رسالة خطأ تظهر:
  ```
  Error decoding CSV file.
  ```

**Pass/Fail:** ___

---

### Test Case 21: Logout و الرجوع
**Steps:**
1. اضغط "View Result"
2. Logout من الـ app
3. Login مجدداً
4. اذهب لـ History

**Expected Result:**
- ✅ البيانات بتتحمّل من الـ API
- ✅ لا مشاكل في الـ permissions

**Pass/Fail:** ___

---

## Summary

| Test Case | Category | Pass | Fail | Notes |
|-----------|----------|------|------|-------|
| 1 | Load File | [ ] | [ ] | |
| 2 | 404 Error | [ ] | [ ] | |
| 3 | No Data | [ ] | [ ] | |
| 4 | Display Grid | [ ] | [ ] | |
| 5 | Auto Calculate | [ ] | [ ] | |
| 6 | Edit Mode | [ ] | [ ] | |
| 7 | Permission | [ ] | [ ] | |
| 8 | Edit Values | [ ] | [ ] | |
| 9 | Save Changes | [ ] | [ ] | |
| 10 | Cancel Edit | [ ] | [ ] | |
| 11 | Download Output | [ ] | [ ] | |
| 12 | Download All | [ ] | [ ] | |
| 13 | Go Back | [ ] | [ ] | |
| 14 | Go Home | [ ] | [ ] | |
| 15 | Logs | [ ] | [ ] | |
| 16 | API Call | [ ] | [ ] | |
| 17 | Save API | [ ] | [ ] | |
| 18 | Load Speed | [ ] | [ ] | |
| 19 | Large File | [ ] | [ ] | |
| 20 | Empty File | [ ] | [ ] | |
| 21 | Logout/Login | [ ] | [ ] | |

**Total:** 21 Test Cases  
**Pass:** ___  
**Fail:** ___  
**Pass Rate:** ___%

---

**Date:** _________  
**Tester:** _________  
**Status:** ✅ Ready for Production / ❌ Needs Fixes
