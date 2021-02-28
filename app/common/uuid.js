const {v4: uuidv4}= require("uuid");

const createUuid = () => {
  return uuidv4()
}

module.exports = {
  createUuid
}
