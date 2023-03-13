import { Data, Order } from "./global"
import { getCurrentReservedItem, OrderTray, reserveItem, store } from "./store"

const BOT_NAMES = [
  'Ava',
  'Bella',
  'Coco',
  'Daisy',
]

const RESTAURANT_NAME = 'Tasty Tidbits'

/*
When a customer lands on the chatbot page, the bot should send these options to the customer:
Select 1 to Place an order
Select 99 to checkout order
Select 98 to see order history
Select 97 to see current order
Select 0 to cancel order
When a customer selects “1”, the bot should return a list of items from the restaurant. It is up to you to create the items in your restaurant for the customer. The order items can have multiple options but the customer should be able to select the preferred items from the list using this same number select system and place an order.
When a customer selects “99” out an order, the bot should respond with “order placed” and if none the bot should respond with “No order to place”. Customer should also see an option to place a new order
When a customer selects “98”, the bot should be able to return all placed order
When a customer selects “97”, the bot should be able to return current order
When a customer selects “0”, the bot should cancel the order if there is.
*/

export class Bot {
  data: Data;
  session: string;
  tray: OrderTray;
  
  /** List of connected clients */
  static clients: Record<string, Data> = {}

  /** Menu options for the bot */
  menu = [
    { value: 1, text: 'Select 1 to place an order' },
    { value: 99, text: 'Select 99 to checkout order' },
    { value: 98, text: 'Select 98 to see order history' },
    { value: 97, text: 'Select 97 to see current order' },
    { value: 96, text: 'Select 96 to see menu' },
    { value: 0, text: 'Select 0 to cancel order' }
  ]

  menu2 = [
    { value: '/help', text: 'Select /help to see menu' },
  ]

  constructor(session: string, data?: Partial<Data>) {
    this.data = {
      botName: data?.botName || BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
      history: data?.history || [],
      currentOrder: data?.currentOrder || null,
      isNewCustomer: data?.isNewCustomer === undefined ? true : data?.isNewCustomer
    }
    this.tray = new OrderTray((this.data.currentOrder as Order)?.items || [])

    this.session = session
    if (!(session in Bot.clients)) {
      Bot.clients[session] = this.data
    }
  }

  /** Remove a client from the list of connected clients */
  destroy() {
    delete Bot.clients[this.session]
  }

  getGreeting() {
    if (!this.data.isNewCustomer) {
      let text = `Welcome back!`
      if (this.data.currentOrder) {
        text += ` You have an order in progress.`
        for (const item of (this.data.currentOrder as Order).items) {
          text += `\n${item.name} - ${item.quantity}`
        }
      }
      return {
        text,
        options: this.menu
      }
    }
    this.data.isNewCustomer = false
    return {
      text: `Hi. I'm ${this.data.botName}. I will be your ${RESTAURANT_NAME} waiter! Your personal assistant for placing orders. Whether you're in the mood for takeout, delivery, or dine-in, I'm here to help you find and order your favorite meals. Just let me know what you're in the mood for and I'll take care of the rest. How can I assist you today?`,
      options: this.menu
    }
  }

  async getResponse(text: string) {
    const action = await this._mapRequestToAction(text)
    return action
  }

  async _mapRequestToAction(text: string) {
    if (this.tray.active && String(text).match(/^(\d+)\s+(\w+)(,\s*\d+\s+\w+)*$/)) {
      return await this._addToOrder(text)
    }
    switch (parseInt(text)) {
      case 1:
        return this._placeOrder()
      case 99:
        return await this._checkoutOrder()
      case 98:
        return this._getOrderHistory()
      case 97:
        return this._getCurrentOrder()
      case 96:
        return this._getMenu()
      case 0:
        return this._cancelOrder()
      default:
        return this._getHelp()
    }
  }

  _getHelp() {
    return {
      text: '',
      options: this.menu
    }
  }

  _placeOrder() {
    if (this.tray.active) {
      return {
        text: `You already have an order in progress. Please checkout your order before placing a new one.`,
        options: this.menu
      }
    }
    this.tray.active = true
    return this._getMenu()
  }

  async _addToOrder(text: string) {
    if (!text) {
      return {
        text: `Could not understand your order. Please try again.`
      }
    }
    const items = text.split(',').map(item => item.trim().split(' '))

    const insufficientOrders: { name: string, quantity: number, available: number }[] = []
    const rejectedOrders: { name: string, quantity: number }[] = []
    const acceptedOrders: { name: string, quantity: number }[] = []
    
    for (const item of items) {
      const quantity = parseInt(item[0])
      const itemName = item.slice(1).join(' ').toLowerCase()

      // if item is in inSufficientOrders skip
      if (insufficientOrders.find(i => i.name === itemName)) {
        continue
      }

      const reservedItem = await getCurrentReservedItem(itemName)
      const alreadyInOrder = this.tray.getItem(itemName) || { quantity: 0 }
      if (!reservedItem) {
        rejectedOrders.push({ name: itemName, quantity })
      } else if (reservedItem.quantity < quantity + alreadyInOrder.quantity) {
        insufficientOrders.push({
          name: itemName,
          quantity,
          available: reservedItem.quantity - alreadyInOrder.quantity
        });
      } else {
        this.tray.add(itemName, quantity)
        acceptedOrders.push({ name: itemName, quantity })
      }
    }
    
    this.data.currentOrder = {
      items: this.tray.items,
      id: Math.random().toString(36).substr(2, 9)
    }

    let responses = []

    if (acceptedOrders.length) {
      let response = `Added the following items to your order.`
      for (const item of acceptedOrders) {
        response += `\n${item.quantity} ${item.name}`
      }
      responses.push(response)
    }

    if (insufficientOrders.length) {
      let response = `Could not find sufficient quantity for the following items.`
      for (const item of insufficientOrders) {
        response += `\n${item.quantity} out of ${item.available} ${item.name}`
      }
      responses.push(response)
    }

    if (rejectedOrders.length) {
      let response = `Could not find the following items.`
      for (const item of rejectedOrders) {
        response += `\n${item.quantity} ${item.name}`
      }
      responses.push(response)
    }

    return {
      text: responses.join('\n\n'),
      options: this.menu2
    }
  }

  _getMenu() {
    // Design in a table format like
    // SN | Item Name | Price
    const header = 'SN | Item Name   | Price'
    const sep = '---+-------------+------'
    const menu = store.map((item, index) => {
      const sn = (index + 1).toString().padStart(2, '0')
      const name = item.name.padEnd(11, ' ');
      // format price to 2 decimal places
      const price = item.price.toFixed(2).padStart(3, ' ')
      return `${sn} | ${name} | $ ${price}`
    });
    return {
      text: `Here is our menu:\n\n${header}\n${sep}\n${menu.join('\n')}`,
    }
  }

  async _checkoutOrder() {
    if (!this.tray.active) {
      return {
        text: `No order to place.`
      }
    }
    this.data.history.push({
      ...(this.data.currentOrder as Order),
      at: Date.now()
    })
    
    const failedReservations: { name: string, quantity: number, available: number }[] = []
    for (const item of this.tray.items) {
      const success = await reserveItem(item.name, item.quantity)
      if (!success) {
        failedReservations.push({
          name: item.name,
          quantity: item.quantity,
          available: (await getCurrentReservedItem(item.name))?.quantity || 0
        })
      }
    }

    this.tray.empty()
    this.tray.active = false
    this.data.currentOrder = null
    
    const responses = ['Your order has been placed.']

    if (failedReservations.length) {
      let response = `Could not find sufficient quantity for the following items.`
      for (const item of failedReservations) {
        response += `\n${item.quantity} out of ${item.available} ${item.name}`
      }
      responses.push(response)
    }

    return {
      text: responses.join('\n\n'),
      options: this.menu2
    }
  }

  _getCurrentOrder() {
    if (!this.data.currentOrder) {
      return {
        text: `You have no current order.`
      }
    }
    const text = (this.data.currentOrder as Order).items.reduce((acc, item) => {
      return acc + '\n' + `${item.name} - ${item.quantity}`
    }, 'Current Order:')
    return {
      text,
      options: this.menu2
    }
  }

  _cancelOrder() {
    if (!this.data.currentOrder) {
      return {
        text: `No order to cancel.`,
        options: this.menu2
      }
    }
    this.data.currentOrder = null
    return {
      text: `Order cancelled.`,
      options: this.menu2
    }
  }

  _getOrderHistory() {
    if (!this.data.history || this.data.history?.length === 0) {
      return {
        text: `You have no order history.`,
        options: this.menu2
      }
    }
    let text = 'Order History:\n', separator = '\n'
    for (const order of this.data.history) {
      text += separator
      text += `Order ID: ${order.id}`
      for (const item of order.items) {
        const price = store.find(i => i.name.toLowerCase() === item.name.toLowerCase())?.price || 0
        text += `\n${item.quantity} ${item.name.padEnd(13)} ---> $${price * item.quantity}`
      }
      separator = '\n\n' + '-'.repeat(20) + '\n\n'
    }

    return {
      text,
      options: this.menu2
    }
  }
}