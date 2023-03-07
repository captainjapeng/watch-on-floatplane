-- Migration number: 0004 	 2023-03-06T12:46:16.531Z
CREATE TABLE channels (
  id INTEGER PRIMARY KEY,
  fp_name TEXT,
  fp_url TEXT,
  fp_id TEXT,
  yt_name TEXT,
  yt_url TEXT
);

INSERT INTO channels (fp_name, fp_url, fp_id, yt_name, yt_url)
VALUES
  ('3D Printing Nerd', '3dprintingnerd', '5e01428f3d4e7d45d06127ed', '3D Printing Nerd', '@3DPrintingNerd'),
  ('BadSeed Tech', 'BadSeedTech', '5e0a600be978e91d74e8c69e', 'BadSeed Tech', '@badseedtech'),
  ('Bitwit Ultra', 'bitwit_ultra', '59fa58f93acf6013471d5822', 'Bitwit', '@Bitwit'),
  ('Craft Computing', 'CraftComputing', '5f8607b7d4470bfe472cbe7c', 'Craft Computing', '@CraftComputing'),
  ('Forgotten Weapons', 'ForgottenWeapons', '5e0bb452fd9eec0f443b3d7f', 'Forgotten Weapons', '@ForgottenWeapons'),
  ('Garbage Time', 'GarbageTime', '61bc20c9a131fb692bf2a513', '', ''),
  ('Gear Seekers', 'GearSeekers', '5e182f33cf10061b3cd5c9bb', 'Gear Seekers', '@GearSeekers'),
  ('Hardware Unboxed', 'HardwareUnboxed', '5f84f83f5edaca3b4d1289c8', 'Hardware Unboxed', '@Hardwareunboxed'),
  ('Ivycomb', 'ivycomb', '605921124e62297311ab72d0', 'ivycomb', '@ivy.'),
  ('Lawful Masses with Leonard French', 'LawfulMasses', '5e0b899b299f45224c8fa332', 'Lawful Masses with Leonard French', '@lawfulmasses'),
  ('Level1Techs', 'level1techs', '5d48c7be5fa46b731f1d5885', 'Level1Techs', '@Level1Techs'),
  ('LinusTechTips', 'linustechtips', '59f94c0bdd241b70349eb72b', 'Linus Tech Tips', '@LinusTechTips'),
  ('Lon.TV', 'LonSeidman', '5e1e1ac47622cc11287c6f11', 'Lon.TV', '@LonSeidman'),
  ('Robert Neal', 'RobertNeal', '5e0b818aced7211628e8b1c4', 'RetroRGB', '@RetroRGB'),
  ('Shank Mods', 'ShankMods', '626ad21aa2ffab0c7d8f69ac', 'Shank Mods', '@ShankMods'),
  ('TechDeals', 'tech_deals', '5ae0f8114336369a2c3619b6', 'Tech Deals', '@TechDeals'),
  ('The Gun Collective', 'TheGunCollective', '5f886b28b1076a23b81ed43c', 'TheGunCollective', '@TheGunCollective'),
  ('The Mighty Jingles', 'TheMightyJingles', '5e0237533d4e7d45d06127f7', 'The Mighty Jingles', '@BohemianEagle'),
  ('Toastybros', 'Toastybros', '5f8741235edaca3b4d128d1d', 'Toasty Bros', '@ToastyBros'),
  ('Tyler McVicker', 'TylerMcVicker', '5e0a35aa5e351721d033a7a4', 'Tyler McVicker', '@TylerMcVicker1'),
  ('UFD Tech', 'ufdtech', '5d3606f85fa46b731f1d581d', 'UFD Tech', '@UFDTech');
