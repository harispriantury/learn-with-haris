import app from "./app";
import connectDb from "./utils/db";
require("dotenv").config();

// create new server
app.listen(process.env.PORT, () => {
  console.log(`server is connected with port ${process.env.PORT}`);
  connectDb();
});
