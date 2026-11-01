/**
 * LDAP authentication — cleartext ldap:// from .env.
 * CWE-319 Tier 2: LDAP_URL=ldap://ldap-host:389 (not ldaps://).
 */
const ldap = require("ldapjs");

function authenticate(username, password) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({ url: process.env.LDAP_URL });
    const userDn = `uid=${username},ou=people,${process.env.LDAP_BASE_DN}`;

    client.bind(userDn, password, (err) => {
      client.unbind();
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = { authenticate };
