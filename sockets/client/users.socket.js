const User = require("../../models/user.model");
const RoomChat = require("../../models/rooms-chat.model");

module.exports = (res) => {
    _io.once('connection', (socket) => {
        //chức năng gửi yêu cầu
        socket.on("CLIENT_ADD_FRIEND", async (userId) => {
            const myUserId = res.locals.user.id;
            //Thêm id của A vào acceptFriend của B
            const existIdAinB = await User.findOne({
                _id: userId,
                acceptFriend: myUserId
            });
            if (!existIdAinB) {
                await User.updateOne({
                    _id: userId,
                }, {
                    $push: { acceptFriend: myUserId }
                });
            }
            // thêm id của B vào requestFriend của A
            const existIdBinA = await User.findOne({
                _id: myUserId,
                requestFriends: userId
            });
            if (!existIdBinA) {
                await User.updateOne({
                    _id: myUserId,
                }, {
                    $push: { requestFriends: userId }
                });
            }
            //Lấy ra độ dài của acceptFriend của B và trả về cho B
            const infoUserB = await User.findOne({
                _id: userId
            });
            const lengthAcceptFriend = infoUserB.acceptFriend.length;
            socket.broadcast.emit("SERVER_RETURN_LENGTH_ACCEPT_FRIEND", {
                userId: userId,
                lengthAcceptFriend: lengthAcceptFriend
            });
            //Lấy info của A và trả về cho B
            const infoUserA = await User.findOne({
                _id: myUserId
            }).select("id avatar fullName");
            socket.broadcast.emit("SERVER_RETURN_INFO_ACCEPT_FRIEND", {
                userId: userId,
                infoUserA: infoUserA
            });
        });
        //chức năng Hủy gửi yêu cầu
        socket.on("CLIENT_CANCEL_FRIEND", async (userId) => {
            const myUserId = res.locals.user.id;
            //Xóa id của A trong acceptFriend của B
            const existIdAinB = await User.findOne({
                _id: userId,
                acceptFriend: myUserId
            });
            if (existIdAinB) {
                await User.updateOne({
                    _id: userId,
                }, {
                    $pull: { acceptFriend: myUserId }
                });
            }
            // Xóa id của B trong requestFriend của A
            const existIdBinA = await User.findOne({
                _id: myUserId,
                requestFriends: userId
            });
            if (existIdBinA) {
                await User.updateOne({
                    _id: myUserId,
                }, {
                    $pull: { requestFriends: userId }
                });
            }
            //Lấy ra độ dài của acceptFriend của B và trả về cho B
            const infoUserB = await User.findOne({
                _id: userId
            });
            const lengthAcceptFriend = infoUserB.acceptFriend.length;
            socket.broadcast.emit("SERVER_RETURN_LENGTH_ACCEPT_FRIEND", {
                userId: userId,
                lengthAcceptFriend: lengthAcceptFriend
            });
            //Lấy id của A trả về cho B
            socket.broadcast.emit("SERVER_RETURN_USER_ID_CANCEL_FRIEND", {
                userIdB: userId,
                userIdA: myUserId
            });
        });

        //chức năng từ chối kết bạn
        socket.on("CLIENT_REFUSE_FRIEND", async (userId) => {
            const myUserId = res.locals.user.id;
            //Xóa id của A trong acceptFriend của B
            const existIdAinB = await User.findOne({
                _id: myUserId,
                acceptFriend: userId
            });
            if (existIdAinB) {
                await User.updateOne({
                    _id: myUserId,
                }, {
                    $pull: { acceptFriend: userId }
                });
            }
            // Xóa id của B trong requestFriend của A
            const existIdBinA = await User.findOne({
                _id: userId,
                requestFriends: myUserId
            });
            if (existIdBinA) {
                await User.updateOne({
                    _id: userId,
                }, {
                    $pull: { requestFriends: myUserId }
                });
            }
        });

        //Thêm {user_id , room_chat_id} của A vào friendsList của B
        //chức năng chấp nhận kết bạn
        socket.on("CLIENT_ACCEPT_FRIEND", async (userId) => {
            const myUserId = res.locals.user.id;

            //Check exist
            const existIdAinB = await User.findOne({
                _id: myUserId,
                acceptFriend: userId
            });
            const existIdBinA = await User.findOne({
                _id: userId,
                requestFriends: myUserId
            });
            //Check exist

            //Tạo phòng chat chung
            let roomChat;
            if(existIdAinB && existIdBinA){
                const dataRoom = {
                    typeRoom: "friend",
                    users: [
                        {
                            user_id: userId,
                            role: "superAdmin"
                        },
                        {
                            user_id: myUserId,
                            role: "superAdmin"
                        },
                    ]
                };
                roomChat = new RoomChat(dataRoom);
                await roomChat.save();

            }
            
            // End Tạo phòng chat chung

            //Xóa id của A trong acceptFriend của B
            if (existIdAinB) {
                await User.updateOne({
                    _id: myUserId,
                }, {
                    $push: {
                        friendList:
                        {
                            user_id: userId,
                            room_chat_id: roomChat.id
                        }
                    },
                    $pull: { acceptFriend: userId }
                });
            }
            //Thêm {user_id , room_chat_id} của B vào friendsList của A
            // Xóa id của B trong requestFriend của A
            if (existIdBinA) {
                await User.updateOne({
                    _id: userId,
                }, {
                    $push: {
                        friendList:
                        {
                            user_id: myUserId,
                            room_chat_id: roomChat.id
                        }
                    },
                    $pull: { requestFriends: myUserId }
                });
            }
        });
    });
};