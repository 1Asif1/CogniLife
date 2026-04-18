# feature_engineering.py

import pandas as pd
import numpy as np

def feature_engineering(df):

    df = df.copy()

    # -------------------------------
    # BASIC CLEANING
    # -------------------------------
    df['Gender'] = df['Gender'].astype(str).str.strip().str.lower()
    df['Gender'] = df['Gender'].map({'male': 0, 'female': 1}).fillna(0)

    # -------------------------------
    # BMI CATEGORY
    # -------------------------------
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
    # INTERNAL FEATURES (used for scoring)
    # -------------------------------
    SleepScore = 1 - abs(df['SleepHours'] - 7.5) / 7.5
    ActivityScore = df['ActivityLevel'] / 5
    DietScore = df['DietQuality'] / 5
    StressScore = df['StressLevel'] / 10
    SedentaryIndex = (df['SittingTime'] + df['InactivityPeriods']) / 20
    DigitalLoad = df['ScreenTime']

    # -------------------------------
    # FINAL FEATURES REQUIRED
    # -------------------------------

    # health_score
    df['health_score'] = (
        SleepScore +
        ActivityScore +
        DietScore +
        (1 - StressScore) +
        (1 - SedentaryIndex)
    ) / 5

    # lifestyle_risk
    df['lifestyle_risk'] = (
        DigitalLoad * 0.2 +
        StressScore * 0.2 +
        SedentaryIndex * 0.2 +
        (1 - SleepScore) * 0.2 +
        (1 - ActivityScore) * 0.2
    )

    # -------------------------------
    # HANDLE MISSING VALUES
    # -------------------------------
    df.fillna(df.mean(numeric_only=True), inplace=True)

    # -------------------------------
    # FINAL FEATURE LIST (STRICT)
    # -------------------------------
    final_features = [
        'ScreenTime', 'SleepHours', 'LateNightUsage', 'ActivityLevel',
        'DietQuality', 'SittingTime', 'InactivityPeriods', 'StressLevel',
        'Gender', 'MealsPerDay', 'CalorieIntake', 'BMI', 'dopamine_score',
        'lifestyle_risk', 'health_score', 'bmi_category'
    ]

    return df[final_features]