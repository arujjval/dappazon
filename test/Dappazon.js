const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Dappazon", () => {
  let dappazon, deployer, buyer

  beforeEach(async() => {
    //Setup contract
    [deployer, buyer] = await ethers.getSigners()

    //Deploy contract
    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy()
  })

  describe("Deployment", async() => {
    it("sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address)
    })
  })

  describe("Listing", async() => {
    let transaction;
    const ID = 1;
    const NAME = "Shoes";
    const CATEGORY = "Clothing";
    const IMAGE = "url";
    const COST = 1000000000000000;
    const RATING = 4;
    const STOCK = 5;

    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )

      await transaction.wait()
    })

    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emits list events", () => {
      expect(transaction).to.emit(dappazon, "List")
    })
  })

  describe("Buying", async() => {
    let transaction;
    const ID = 1;
    const NAME = "Shoes";
    const CATEGORY = "Clothing";
    const IMAGE = "url";
    const COST = 1000000000000000;
    const RATING = 4;
    const STOCK = 5;

    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )
      
      await transaction.wait()

      transaction = await dappazon.connect(buyer).buy(ID, { value: COST})
    })

      it("Updates the contract balance", async () => {
        const result = await ethers.provider.getBalance(dappazon.address)
        console.log(result)
        expect(result).to.equal(COST)
      })

      it("Updates buyer's order count", async() => {
        const result  = await dappazon.orderCount(buyer.address)
        expect(result).to.equals(1)
      })

      it("Adds the order", async() => {
        const order = await dappazon.orders(buyer.address, 1)

        expect(order.time).to.greaterThan(10)
        expect(order.item.name).to.equals(NAME)
      })
  })

  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })
  })
})
