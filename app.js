	const express = require('express');
	const cors = require('cors');
	const path = require('path');
	const port = process.env.PORT || 9090;
	const app = express();

	app.use('/', express.static(path.join(__dirname, '/')));
  app.listen(port, err => {
    err
      ? console.log(err)
      : console.log("Listening in port " + port);
  })