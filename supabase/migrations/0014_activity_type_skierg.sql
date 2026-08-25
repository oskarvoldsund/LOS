-- Adds a distinct category for ski-erg sessions so training stats can break
-- them out from "other" (requested alongside per-activity stats).
alter type public.activity_type add value 'skierg';
