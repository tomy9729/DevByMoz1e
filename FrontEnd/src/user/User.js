class User {
    constructor(myid, id, name, birth, email) {
        this.myid = myid
        this.id = id
        this.name = name
        this.birth = birth
        this.email = email
    }
}

User.getDefault = function () {
    return new User("", "", "", "")
}

export default User