import { v4 as uuid } from 'uuid';
export default class User {
  constructor(organization, fName, lName, email, username, password) {
    this.userID = `user-${uuid().slice(-8)}`;
    this.organizationID = `org-${uuid().slice(-8)}`;
    this.organization = organization;
    this.fName = fName;
    this.lName = lName;
    this.email = email
    this.username = username;
    this.password = password;
    this.isAdmin = true;
    this.status = 'pending';
  }

  updateUser(data) {
    for (let key in data) {
      if (this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    }
    this.updatedAt = new Date();
  }
}