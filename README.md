# CGPA Calculator

A free, no-login web app that helps students calculate their **semester GPA** and their **cumulative CGPA**.
Built with plain HTML, CSS and JavaScript no frameworks, no backend, no database.

## 1. How to use the app

### Step 1: Enter your courses

1. Open the **Calculator** page.
2. For each course, fill in:
   - **Course code** (e.g. `CSC101`)
   - **Course title** (e.g. `Introduction to Computer Science`)
   - **Credit unit** (choose from the dropdown)
   - **Grade** (choose from the dropdown)
3. Need more rows? Click **Add course**. Need fewer? Click the **trash icon** on a row.
4. The four courses shown at the start are only examples. Edit or delete them.

### Step 2 : (Optional) Add your earlier results

Fill in **Previous semesters** only if you want a true cumulative CGPA:

- **Credit units completed before** : total credit units from all earlier semesters.
- **CGPA before this semester** : your CGPA at the end of last semester.

Leave both empty if this is your first semester. The app will then tell you the CGPA
is based on this semester only.

### Step 3 : Calculate

Click **Calculate**. You will see:

- **GPA** : your result for this semester.
- **CGPA** : your overall result.

Open the **Results** page for a full breakdown of every course.

### If you change something

Edit, add or remove a course after calculating and a yellow notice appears.
Click **Calculate** (or **Recalculate** on the Results page) to refresh the numbers.

### If you see a red error box

The app lists exactly what to fix, for example "Row 2: choose a grade." Fix the highlighted fields and calculate again.

### Clear everything

Click **Clear all**, then confirm. This deletes all courses and previous-semester data.

---

## 2. How the numbers are calculated

| Term                        | Formula                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Quality points (one course) | grade point × credit unit                                                                                          |
| **GPA** (this semester)     | total quality points ÷ total credit units                                                                          |
| **CGPA** (overall)          | (previous CGPA × previous credits + this semester's quality points) ÷ (previous credits + this semester's credits) |

### Grade scale used (5.0 scale)

| Grade  | A   | B   | C   | D   | E   | F   |
| ------ | --- | --- | --- | --- | --- | --- |
| Points | 5   | 4   | 3   | 2   | 1   | 0   |

> **Check your school's official scale.** Grade points differ between universities.
> To change them, edit `GRADE_SCALE` at the top of `script.js` it is the only place they are stored.

### Worked example

| Course    | Credits | Grade | Points | Quality points |
| --------- | ------- | ----- | ------ | -------------- |
| CSC101    | 3       | A     | 5      | 15             |
| MAT101    | 3       | B     | 4      | 12             |
| PHY101    | 3       | C     | 3      | 9              |
| ENG101    | 2       | B     | 4      | 8              |
| **Total** | **11**  |       |        | **44**         |

- **GPA** = 44 ÷ 11 = **4.00**
- If you also had 30 earlier credits with a CGPA of 3.80 (that is 114 quality points):
  **CGPA** = (114 + 44) ÷ (30 + 11) = 158 ÷ 41 = **3.85**

Results are shown to 2 decimal places. The app does **not** assign degree classes
(First Class, etc.) because those rules differ between schools.

## 3. Features

- Add, edit and remove courses; clear everything with confirmation
- GPA and cumulative CGPA calculated separately
- Input checking with friendly messages (missing fields, duplicate course codes, invalid numbers)
- Warning when results are out of date
- Works on phones, tablets and desktops (sidebar on desktop, bottom navigation on phones)
- Keyboard friendly, with visible focus and labelled controls
- Your entries are remembered in your browser (see Limitations)

## 4. Project structure

```
index.html   The page structure (four views: Home, Calculator, Results, About)
style.css    All styling, organised into numbered sections with comments
script.js    Calculations, validation, navigation (organised into numbered sections)
README.md    This file
```

## 5. Run it locally

Open `index.html` in a browser. No installation needed.
(Optional: run `npx serve .` in this folder.)

## 6. Deploy to Vercel (free)

1. Create a GitHub repository and upload `index.html`, `style.css`, `script.js` and `README.md` to the **root** of the repo.
2. Go to vercel.com → **Add New → Project** and import the repository.
3. Set **Framework Preset** to **Other**. Leave the build command and output directory empty.
4. Click **Deploy**. Vercel gives you a live link.

## 7. Limitations (please read)

- Data is saved **only in your own browser** (localStorage). It is not sent anywhere, does not sync between devices, and can be lost if you clear your browser data.
- Only one grading scale is supported at a time.
- The results are for guidance. Your school's official transcript is the final authority.
- Tested in desktop Chromium at phone, tablet and desktop widths. Safari, Firefox and real phones should be tested before relying on it.

## 8. About this project

Built as a school project to practise HTML, CSS and JavaScript.

**What I learned:** _write this section yourself : for example how you handled validation, why GPA and CGPA are calculated separately, and what you would improve next._
