class User {
    constructor(id, name, birth, email) {
        this.id = id
        this.name = name
        this.birth = birth
        this.email = email
    }
}

User.getDefault = function () {
    return new User(0, "", "", "")
}

export default User