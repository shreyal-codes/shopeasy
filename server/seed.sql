-- Sample data: 3 categories and 15 products.
-- The admin + demo customer accounts are added by db.js because their
-- passwords have to be hashed with bcrypt first (see README).

INSERT INTO categories (name) VALUES ('Electronics'), ('Clothing'), ('Home & Kitchen');

INSERT INTO products (category_id, name, description, price, stock, image_url) VALUES
(1, 'Wireless Earbuds',      'Bluetooth 5.0 earbuds with charging case and 20 hour battery.',        149900, 25, '/images/p1.svg'),
(1, 'Smart Watch',           'Fitness tracker with heart rate monitor and sleep tracking.',          229900, 12, '/images/p2.svg'),
(1, 'Power Bank 10000mAh',   'Slim fast-charging power bank with two USB ports.',                     89900, 40, '/images/p3.svg'),
(1, 'Bluetooth Speaker',     'Portable waterproof speaker with deep bass.',                          119900,  3, '/images/p4.svg'),
(1, 'Gaming Mouse',          'Ergonomic RGB mouse with adjustable DPI.',                              69900, 18, '/images/p5.svg'),
(2, 'Cotton T-Shirt',        'Soft 100% cotton round neck t-shirt, regular fit.',                     39900, 60, '/images/p6.svg'),
(2, 'Denim Jacket',          'Classic blue denim jacket with button closure.',                       189900,  8, '/images/p7.svg'),
(2, 'Running Shoes',         'Lightweight breathable shoes with cushioned sole.',                    249900, 15, '/images/p8.svg'),
(2, 'Hooded Sweatshirt',     'Warm fleece hoodie with front pocket.',                                109900,  0, '/images/p9.svg'),
(2, 'Leather Wallet',        'Genuine leather wallet with 6 card slots.',                             59900, 30, '/images/p10.svg'),
(3, 'Non-stick Frying Pan',  '24 cm non-stick pan, works on gas and induction.',                      79900, 22, '/images/p11.svg'),
(3, 'Electric Kettle 1.5L',  'Stainless steel kettle with auto shut-off.',                            99900, 14, '/images/p12.svg'),
(3, 'Ceramic Dinner Set',    '18 piece ceramic dinner set, microwave safe.',                         199900,  5, '/images/p13.svg'),
(3, 'LED Table Lamp',        'Touch dimmable desk lamp with USB charging port.',                      49900, 35, '/images/p14.svg'),
(3, 'Cotton Bedsheet Set',   'Double bedsheet with 2 pillow covers, 180 TC cotton.',                  89900,  4, '/images/p15.svg');
