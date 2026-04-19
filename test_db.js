const db = require('./db');

db.serialize(() => {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'", (err, row) => {
    if (err) {
      console.error(err);
    } else if (row) {
      console.log("Table 'conversations' exists.");
    } else {
      console.log("Table 'conversations' does not exist.");
    }
  });

  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'", (err, row) => {
    if (err) {
      console.error(err);
    } else if (row) {
      console.log("Table 'messages' exists.");
    } else {
      console.log("Table 'messages' does not exist.");
    }
  });
});

setTimeout(() => {
  db.close();
}, 1000);
