module.exports = 
{
  db_username: "postgres",
  db_password: "sample_password",

  db_port: 5432,
  db_host: 'localhost',

  db_name: 'express_db',

  admin_password_salt: '$2a$10$MqHs4.t5uGwbJ/vpcoyase',
  admin_password_hash: '$2a$10$MqHs4.t5uGwbJ/vpcoyaseD7dW1pvgAOUd6HACb9C36Dp/q7OX.9m', // Password: NOklIvABEvR9tYFpUumC9+EqVQZuI0Nj

  max_threads: 100,
  ban_unit: 'minutes',

  max_mod_ban_length: 60 * 24,

  require_image: true,
  min_chars: 25,
  max_chars: 500,

  allowed_images: ['png', 'gif', 'jpg', 'jpeg', 'webm'],
  max_filesize: 2, // MB

  boards: {
    a: {
      description: 'Anime',
      tripcode_enabled: true,
      password_salt: '$2a$10$0mP55rD/KnguEYLBc.57FO',
      password_hash: '$2a$10$0mP55rD/KnguEYLBc.57FOedIOXoc2gPtSzT1D2uVJSCuWC.UT4Mm' // Password: k++JxocMRh7dgSkzBjoAyo385x1ETiZR
    },
    b: {
      description: 'Random',
      tripcode_enabled: false,
      password_salt: '$2a$10$g5v0UPwITP.SB/kFizuNZO',
      password_hash: '$2a$10$g5v0UPwITP.SB/kFizuNZOMdYor4JaM0pTeN1DxJHB1n1gSfAdR5a' // Password: fx2WLzL94CP9r5CApIDX6ft6cs5atLs2
    },
    m: {
      description: 'Music',
      tripcode_enabled: true,
      password_salt: '$2a$10$Xi8ceFCxAgQGNF5YnwdSaO',
      password_hash: '$2a$10$Xi8ceFCxAgQGNF5YnwdSaOhhHCGh/aTsBsfw1.o.mT54gHUeNONcm' // Password: T/79y96ETw139oqk1NPuF9xpEpMW4XF7
    }
  },

  threads_per_page: 10,

  secret: "abcd", // Should be a long, secure string of random letters, numbers, and special characters
  salt: "efgh", // ^ 
}