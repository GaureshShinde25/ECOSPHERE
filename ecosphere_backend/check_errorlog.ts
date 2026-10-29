import msnodesql from 'msnodesqlv8';

const connStr = 'Driver={ODBC Driver 17 for SQL Server};Server=LAPTOP-LFA2J60D\\SQLEXPRESS;Database=master;Trusted_Connection=yes;';

msnodesql.open(connStr, (err, conn) => {
  if (err) {
    console.error('Cannot connect to master:', err);
    return;
  }
  conn.query('EXEC xp_readerrorlog 0, 1', (e, res) => {
    if (e) {
      console.error('xp_readerrorlog error:', e);
    } else {
      const rows = res.slice(-25);
      for (const r of rows) {
        console.log(r.LogDate, r.ProcessInfo, r.Text);
      }
    }
    conn.close();
  });
});
