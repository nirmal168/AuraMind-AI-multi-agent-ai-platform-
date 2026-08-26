import { api } from "../../utils/axios"

export const createOrder = async (plan, userId) => {
  try {
    const { data } = await api.post(
      '/api/billing/create',
      { plan },
      {
        headers: {
          'x-user-id': userId
        }
      }
    )

    console.log("CREATE ORDER RESPONSE:", data)

    return data
  } catch (error) {
    console.log(
      "CREATE ORDER ERROR:",
      error.response?.data || error.message
    )
    throw error
  }
}