const fs = require('fs');
const path = require('path');
const userDBPath = path.join(__dirname, '..', 'data', 'users.json');

exports.meta = {
  name: "casino",
  aliases: ["gamble", "bet"],
  prefix: "both",
  version: "2.0.0",
  author: "Kaiz API",
  description: "Casino with login/register and saved balance",
  guide: ["register <password>", "login <password>", "balance", "bet <amount>", "reset"],
  category: "fun"
};

// Ensure data file exists
if (!fs.existsSync(userDBPath)) {
  fs.mkdirSync(path.dirname(userDBPath), { recursive: true });
  fs.writeFileSync(userDBPath, '{}');
}

// Load users from JSON
function loadUsers() {
  return JSON.parse(fs.readFileSync(userDBPath, 'utf-8'));
}

// Save users to JSON
function saveUsers(users) {
  fs.writeFileSync(userDBPath, JSON.stringify(users, null, 2));
}

exports.onStart = async function ({ wataru, msg, chatId, args }) {
  if (!args[0]) {
    return await wataru.reply(`🎰 Casino Commands:\n- register <password>\n- login <password>\n- balance\n- bet <amount>\n- reset`);
  }

  const users = loadUsers();
  const command = args[0].toLowerCase();
  const user = users[chatId];

  // REGISTER
  if (command === 'register') {
    const password = args[1];
    if (!password) return await wataru.reply("🔒 Please provide a password to register.");
    if (user) return await wataru.reply("❌ You're already registered. Use `login <password>`.");

    users[chatId] = {
      password,
      balance: 1000,
      loggedIn: true
    };
    saveUsers(users);
    return await wataru.reply("✅ Registered and logged in. Starting balance: $1000.");
  }

  // LOGIN
  if (command === 'login') {
    const password = args[1];
    if (!user) return await wataru.reply("❌ You're not registered. Use `register <password>`.");
    if (user.password !== password) return await wataru.reply("🚫 Incorrect password.");
    user.loggedIn = true;
    saveUsers(users);
    return await wataru.reply("🔓 Logged in successfully.");
  }

  // Must be logged in
  if (!user || !user.loggedIn) {
    return await wataru.reply("🔐 Please login first using `login <password>`.");
  }

  // BALANCE
  if (command === 'balance') {
    return await wataru.reply(`💰 Your current balance: $${user.balance}`);
  }

  // RESET
  if (command === 'reset') {
    user.balance = 1000;
    saveUsers(users);
    return await wataru.reply("🔄 Balance reset to $1000.");
  }

  // BET
  if (command === 'bet') {
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return await wataru.reply("❌ Enter a valid amount to bet.");
    if (amount > user.balance) return await wataru.reply("💸 You don’t have enough balance.");

    const win = Math.random() < 0.5;
    user.balance += win ? amount : -amount;
    saveUsers(users);

    return await wataru.reply(win
      ? `🎉 You won $${amount}!\n💰 New balance: $${user.balance}`
      : `😢 You lost $${amount}.\n💰 New balance: $${user.balance}`
    );
  }

  return await wataru.reply("❓ Unknown command. Use `balance`, `bet <amount>`, or `reset`.");
};
