const createEmergency = async (request ,h) =>{
  const { pic_pet, pet_category, pet_community, pet_location, pet_status } = request.payload;

  if (!pic_pet || !pet_category || !pet_community || !pet_location){
    const response = h.response({
      status : "fail",
      message : "all data must be filled",
    });
    response.code(400);
    return response;
  }

  const id = nanoid(16);


}