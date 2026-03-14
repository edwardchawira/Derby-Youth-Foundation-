-- Add test products to the database for testing the search functionality
-- Run this in Supabase SQL Editor

-- First, check if products table has any data
SELECT COUNT(*) as product_count FROM products;

-- If count is 0, insert test products:
INSERT INTO products (name, description, price, technical_specs, youtube_url) VALUES
('Shure SM7B Dynamic Microphone', 'Professional broadcast dynamic microphone with flat, wide-range frequency response perfect for music and speech', 399.99, '{"type": "Dynamic", "frequency_response": "50Hz-20kHz", "polar_pattern": "Cardioid", "connectivity": "XLR"}'::jsonb, NULL),
('Audio-Technica AT2020 Cardioid Condenser Microphone', 'Cardioid condenser microphone offering exceptional detail and resolution with wide dynamic range', 99.99, '{"type": "Condenser", "frequency_response": "20Hz-20kHz", "polar_pattern": "Cardioid", "connectivity": "XLR"}'::jsonb, NULL),
('Blue Yeti USB Microphone', 'Professional USB condenser microphone with multiple polar patterns - perfect for podcasting, streaming, and recording', 129.99, '{"type": "Condenser", "frequency_response": "20Hz-20kHz", "polar_patterns": ["Cardioid", "Bidirectional", "Omnidirectional", "Stereo"], "connectivity": "USB"}'::jsonb, NULL),
('Rode NT1-A Condenser Microphone', 'Large-diaphragm condenser microphone with high SPL handling and low self-noise', 229.00, '{"type": "Condenser", "frequency_response": "20Hz-20kHz", "polar_pattern": "Cardioid", "connectivity": "XLR"}'::jsonb, NULL),
('AKG C214 Large Diaphragm Condenser Microphone', 'Large-diaphragm condenser microphone with switchable bass-cut filter and -20dB pad', 349.00, '{"type": "Condenser", "frequency_response": "20Hz-20kHz", "polar_pattern": "Cardioid", "connectivity": "XLR", "features": ["Bass-cut filter", "-20dB pad"]}'::jsonb, NULL),
('Focusrite Scarlett 2i2 Audio Interface', '2-in, 2-out USB audio interface with high-performance preamps for recording microphones and instruments', 169.99, '{"type": "Audio Interface", "inputs": 2, "outputs": 2, "connectivity": "USB-C", "sample_rate": "192kHz/24-bit"}'::jsonb, NULL),
('Yamaha HS8 Studio Monitor', '8-inch powered studio monitor with room control and high trim response for accurate mixing', 349.99, '{"type": "Studio Monitor", "size": "8-inch woofer", "power": "120W", "frequency_response": "38Hz-30kHz"}'::jsonb, NULL),
('Presonus Eris E3.5 Studio Monitors', 'Compact 3.5-inch studio monitors perfect for small studios and desktop setups', 99.99, '{"type": "Studio Monitor", "size": "3.5-inch woofer", "power": "25W", "frequency_response": "80Hz-20kHz"}'::jsonb, NULL);

-- After inserting, verify the products were added:
SELECT id, name, price FROM products ORDER BY created_at DESC;
