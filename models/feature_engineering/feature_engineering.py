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
    # BMI (FROM SUPABASE)
    # -------------------------------
    df['BMI'] = df['Weight'] / ((df['Height'] / 100) ** 2)

    # -------------------------------
    # STRESS LEVEL (DERIVED)
    # -------------------------------
    df['StressLevel'] = (
        df['ScreenTime'] * 0.3 +
        df['LateNightUsage'] * 2 +
        (10 - df['SleepHours']) * 0.4 +
        df['InactivityPeriods'] * 0.3
    )
    df['StressLevel'] = df['StressLevel'].clip(1, 10)

    # -------------------------------
    # DOPAMINE SCORE (DERIVED)
    # -------------------------------
    df['dopamine_score'] = (
        df['ScreenTime'] * 0.4 +
        df['LateNightUsage'] * 2 +
        df['StressLevel'] * 0.3 +
        (10 - df['SleepHours']) * 0.3
    )
    df['dopamine_score'] = df['dopamine_score'].clip(1, 10)

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
    # INTERNAL SCORES
    # -------------------------------
    SleepScore = 1 - abs(df['SleepHours'] - 7.5) / 7.5
    ActivityScore = df['ActivityLevel'] / 5
    DietScore = df['MealsPerDay'] / 5  # simplified proxy
    StressScore = df['StressLevel'] / 10
    SedentaryIndex = (df['SittingTime'] + df['InactivityPeriods']) / 20
    DigitalLoad = df['ScreenTime']

    # -------------------------------
    # FINAL ENGINEERED FEATURES
    # -------------------------------
    df['health_score'] = (
        SleepScore +
        ActivityScore +
        DietScore +
        (1 - StressScore) +
        (1 - SedentaryIndex)
    ) / 5

    df['lifestyle_risk'] = (
        DigitalLoad * 0.2 +
        StressScore * 0.2 +
        SedentaryIndex * 0.2 +
        (1 - SleepScore) * 0.2 +
        (1 - ActivityScore) * 0.2
    )

    # -------------------------------
    # DROP RAW DB FIELDS (NOT USED IN MODEL)
    # -------------------------------
    df.drop(columns=['Height', 'Weight'], inplace=True)

    # -------------------------------
    # FINAL FEATURE LIST (MODEL INPUT)
    # -------------------------------
    final_features = [
        'ScreenTime',
        'SleepHours',
        'LateNightUsage',
        'ActivityLevel',
        'MealsPerDay',
        'SittingTime',
        'InactivityPeriods',
        'StressLevel',
        'Gender',
        'CalorieIntake',
        'BMI',
        'dopamine_score',
        'lifestyle_risk',
        'health_score',
        'bmi_category'
    ]

    # Handle missing values
    df.fillna(df.mean(numeric_only=True), inplace=True)

    return df[final_features]