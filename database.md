# Database

```javascript
r.db('dermail').tableCreate('accounts', {
  primaryKey: 'accountId'
})
r.db('dermail').tableCreate('domains', {
  primaryKey: 'domainId'
})
r.db('dermail').tableCreate('folders', {
  primaryKey: 'folderId'
})
r.db('dermail').tableCreate('pushSubscriptions', {
  primaryKey: 'userId'
})
r.db('dermail').tableCreate('messageHeaders', {
  primaryKey: 'headerId'
})
r.db('dermail').tablseCreate('messages', {
  primaryKey: 'messageId'
})
r.db('dermail').tableCreate('queue', {
  primaryKey: 'queueId'
})
r.db('dermail').tableCreate('users', {
  primaryKey: 'userId'
})
r.db('dermail').tableCreate('filters', {
  primaryKey: 'filterId'
})
r.db('dermail').tableCreate('greylist', {
  primaryKey: 'hash'
})
```

```javascript
r.db('dermail').table("users").indexCreate("username")
r.db('dermail').table("accounts").indexCreate("userId")
r.db('dermail').table("folders").indexCreate("accountId")
r.db('dermail').table("messages").indexCreate("accountId")
r.db('dermail').table("messages").indexCreate("folderId")
r.db('dermail').table("messages").indexCreate("_messageId")
r.db('dermail').table("queue").indexCreate("userId")
r.db('dermail').table("filters").indexCreate("accountId")
r.db('dermail').table("greylist").indexCreate("lastSeen")
```

Add secondary index of "folderId" and "isRead" to table "messages" as "unreadCount"
```javascript
r.db('dermail').table('messages').indexCreate('unreadCount', [r.row('folderId'), r.row('isRead')])
```

Add secondary index of "folderSavedOn" to table "messages"
```javascript
r.db('dermail').table("messages").indexCreate("folderSavedOn", function(row) {
    return [row('folderId', row('savedOn'))]
})
```

user and account mapping in "accounts"
```javascript
r.db('dermail').table('accounts').indexCreate('userAccountMapping', [ r.row('userId'),  r.row('accountId')])
```

message and account mapping in "messages"
```javascript
r.db('dermail').table('messages').indexCreate('messageAccountMapping', [r.row('messageId'), r.row('accountId')])
```

account and folder mapping in "folders"
```javascript
r.db('dermail').table('folders').indexCreate('accountFolderMapping', [ r.row('accountId'),  r.row('folderId')])
```

```javascript
r.table('accounts').indexCreate('friendlyName', r.row('addresses')('name'), {multi: true})
r.table('accounts').indexCreate('addresses', r.row('addresses')('address'), {multi: true})
```

```javascript
r.table('messages').indexCreate('attachmentChecksum', r.row('attachments')('checksum'), {multi: true})
r.table('messages').indexCreate('attachmentContentId', r.row('attachments')('contentId'), {multi: true})
```

# TO DO for rx

secondary index of "domain" to table "domains"
```javascript
r.db('dermail').table('domains').indexCreate("domain")
```

secondary (multi) index of "alias" to table "domains" `.indexCreate("alias", {multi: true})`
```javascript
r.db('dermail').table('domains').indexCreate("alias", {multi: true})
```

compound index of account + domainId in table "accounts"
```javascript
r.db('dermail').table('accounts').indexCreate('accountDomainId', [ r.row('account'),  r.row('domainId')])
```

compound index of accountId + 'Index' in table "folders"
```javascript
r.db('dermail').table('folders').indexCreate('inboxAccountId', [ r.row('displayName'),  r.row('accountId') ])
```
