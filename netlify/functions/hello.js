// Debug flag
const DEBUG = true;

exports.handler = async () => {
  if (DEBUG) console.log("Handler invoked");
  return {
    statusCode: 200,
    body: "Hello"
  };
};
