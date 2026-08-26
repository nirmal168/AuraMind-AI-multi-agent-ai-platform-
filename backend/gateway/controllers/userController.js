export const getCurrentUser = async (req , res) =>{
   try {
    console.log("reached")
     return res.status(200).json(req.user)
   } catch (error) {
    console.log(error)
    return res.status(500).json({message:`get current user error ${error}`})
   }
}