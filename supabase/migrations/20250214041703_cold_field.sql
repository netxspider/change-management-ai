/*
  # Create Risk Analysis History Table

  1. New Tables
    - `risk_analysis_history`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `change_type` (text)
      - `affected_systems` (integer)
      - `urgency` (text)
      - `rollback_complexity` (text)
      - `risk_level` (text)
      - `confidence` (numeric)
      - `user_id` (uuid, references auth.users)

  2. Security
    - Enable RLS on `risk_analysis_history` table
    - Add policies for authenticated users to:
      - Insert their own records
      - Read their own records
*/

CREATE TABLE IF NOT EXISTS risk_analysis_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  change_type text NOT NULL,
  affected_systems integer NOT NULL,
  urgency text NOT NULL,
  rollback_complexity text NOT NULL,
  risk_level text NOT NULL,
  confidence numeric NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid()
);

ALTER TABLE risk_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own records"
  ON risk_analysis_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own records"
  ON risk_analysis_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);