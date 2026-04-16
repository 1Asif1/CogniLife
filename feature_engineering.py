import pandas as pd
import numpy as np

# -------------------------------
# Load Data
# -------------------------------
train_df = pd.read_csv("train_data.csv")
test_df = pd.read_csv("test_data.csv")

# Combine for consistent processing
df = pd.concat([train_df, test_df], axis=0)

# -------------------------------
# 1. CLEAN TEXT COLUMNS (IMPORTANT FIX)
# -------------------------------

# Gender fix
df['Gender'] = df['Gender'].astype(str).str.strip().str.lower()
df['Gender'] = df['Gender'].map({
    'male': 0,
    'female': 1
})
df['Gender'].fillna(0, inplace=True)

# BMI category fix (RECALCULATE instead of trusting raw)
def bmi_category(bmi):
    if bmi < 18.5:
        return 0
    elif bmi < 25:
        return 1
    elif bmi < 30:
        return 2
    else:
        return 3

df['bmi_category'] = df['BMI'].apply(bmi_category)

# -------------------------------
# 2. SLEEP FEATURES
# -------------------------------
df['SleepScore'] = 1 - abs(df['SleepHours'] - 7.5) / 7.5

# -------------------------------
# 3. DIGITAL BEHAVIOR FEATURES
# -------------------------------
df['DigitalLoad'] = df['ScreenTime']
df['LateNightImpact'] = df['LateNightUsage'] * df['ScreenTime']

# -------------------------------
# 4. ACTIVITY & SEDENTARY FEATURES
# -------------------------------
df['ActivityScore'] = df['ActivityLevel'] / df['ActivityLevel'].max()

df['SedentaryIndex'] = (
    df['SittingTime'] + df['InactivityPeriods']
) / (df['SittingTime'].max() + df['InactivityPeriods'].max())

# -------------------------------
# 5. DIET FEATURES
# -------------------------------
df['CalorieBalance'] = df['CalorieIntake'] / 2000
df['MealScore'] = df['MealsPerDay'] / df['MealsPerDay'].max()
df['DietScore'] = df['DietQuality'] / df['DietQuality'].max()

# -------------------------------
# 6. STRESS FEATURE
# -------------------------------
df['StressScore'] = df['StressLevel'] / df['StressLevel'].max()

# -------------------------------
# 7. DOPAMINE FEATURE
# -------------------------------
df['DopamineScore'] = df['dopamine_score'] / df['dopamine_score'].max()

# -------------------------------
# 8. FATIGUE INDEX (OPTIONAL - DROP BEFORE MODEL)
# -------------------------------
df['FatigueIndex'] = (
    (1 - df['SleepScore']) +
    df['StressScore'] +
    df['SedentaryIndex'] +
    df['LateNightImpact'] / (df['LateNightImpact'].max() + 1)
) / 4

# -------------------------------
# 9. HANDLE MISSING VALUES
# -------------------------------
df.fillna(df.mean(numeric_only=True), inplace=True)

# -------------------------------
# 10. FINAL CHECK (DEBUGGING)
# -------------------------------
print("Gender unique:", df['Gender'].unique())
print("BMI category unique:", df['bmi_category'].unique())

# -------------------------------
# 11. SPLIT BACK
# -------------------------------
train_processed = df.iloc[:len(train_df)]
test_processed = df.iloc[len(train_df):]

# -------------------------------
# 12. SAVE
# -------------------------------
train_processed.to_csv("train_processed.csv", index=False)
test_processed.to_csv("test_processed.csv", index=False)

print("Feature Engineering Completed Successfully ✅")
