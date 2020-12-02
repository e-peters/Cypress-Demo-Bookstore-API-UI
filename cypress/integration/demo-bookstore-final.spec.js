describe('Demo Cypress API+UI testing - Bookstore', () => {

  const apiUrl = Cypress.env('apiUrl')  // cypress.json: "env":{ "apiUrl": "https://demoqa.com" }
  var   bookAuthor = 'Richard E. Silverman'
  var   bookTitle  = 'Git Pocket Guide'

  context('separate UI + API tests', () => {
    it('1. UI - validate 1st book on screen', () => {
      // visits UI of the bookstore
      cy.visit('/')   // uses baseUrl from cypress.json
      cy.url().should('include', 'books')
      cy.get('[id="see-book-Git Pocket Guide"] a').should('contain', bookTitle)
      cy.get('[id="see-book-Git Pocket Guide"]').parent().parent().parent().children().should('contain', bookAuthor)
    })
    
    it('2. API - validate 1st book in response', () => {
      // requests an API of the bookstore
      cy.request({
        method: 'GET',
        url:     apiUrl+'/BookStore/v1/Books'   // uses apiUrl from cypress.json
      })
        .then((response) => {
          cy.log(response.body.books[0].author)
          expect(response.body.books[0].author).to.be.eql(bookAuthor)
          expect(response.body.books[0].title).to.be.eql(bookTitle)
          let isbn = response.body.books[0].isbn
          cy.log('isbn: '+ isbn)
          // cy.writeFile('cypress/fixtures/books.json', response.body.books) // can be used as input for fixture file
        })
    })
  })

  context('combined API + UI tests', () => {
    // test cases to validate the result from the API in the UI
    
    it('1. API + UI - validate 1st book from response on screen', () => {
      // first call the API
      cy.request({
        method: 'GET',
        url:     apiUrl+'/BookStore/v1/Books'
      })
        .then((response) => {
          cy.log(response.body.books[0].author)
          expect(response.body.books[0].author).to.be.eql(bookAuthor)
          expect(response.body.books[0].title).to.be.eql(bookTitle)
          let isbn = response.body.books[0].isbn
          cy.log('isbn: '+ isbn)

          // then validate the same in the UI
          cy.log('- switch from API to UI -')
          cy.visit('/')
          cy.url().should('include', 'books')
          cy.get('[id="see-book-Git Pocket Guide"] a').should('contain', response.body.books[0].title)
          cy.get('[id="see-book-Git Pocket Guide"]').parent().parent().parent().children().should('contain', response.body.books[0].author)
        })
    })

    // 2 different ways of looping through the response
    // 2a) for-loop
    // 2b) forEach-loop
    it('2a. API + UI - validate all books from response on screen - for-loop', () => {
      var books

      // first call the API
      cy.request({
        method: 'GET',
        url:     apiUrl+'/BookStore/v1/Books'
      })
        .then((response) => {
          books = response.body.books // store all books from response.body.books into new var books
          cy.log(books)
          
          // for-loop
          cy.log('- for-loop through response')
          for(var index in books) {
            cy.log('book: '+ index, books[index])
          }

          // then validate the same in the UI
          cy.log('- switch from API to UI -')
          cy.visit('/') // cypress.json: "baseUrl": "https://demoqa.com/books"

          // for-loop
          cy.log('- for-loop through response and validate on screen')
          for(var index in books) {
            cy.log('book: '+ index, books[index])
            cy.get('.books-wrapper .rt-tbody > :nth-child('+(parseInt(index)+1)+')').should('contain', books[index].title)
            cy.get('.books-wrapper .rt-tbody > :nth-child('+(parseInt(index)+1)+')').should('contain', books[index].author)
          }
        })
    })

    it('2b. API + UI - validate all books from response on screen - forEach-loop', () => {
      var books

      // first call the API
      cy.request({
        method: 'GET',
        url:     apiUrl+'/BookStore/v1/Books'
      })
        .then((response) => {
          books = response.body.books // store all books from response.body.books into new var books
          cy.log(books)
          
          // forEach-loop
          cy.log('- forEach-loop through response')
          books.forEach((book, index) => {
            cy.log('book: '+index, book)
          })

          // then validate the same in the UI
          cy.log('- switch from API to UI -')
          cy.visit('/') // cypress.json: "baseUrl": "https://demoqa.com/books"

          // forEach-loop
          cy.log('- forEach-loop through response and validate on screen')
          books.forEach((book, index) => {
            cy.log('book: '+index, book)
            cy.get('.books-wrapper .rt-tbody > :nth-child('+(index+1)+')').should('contain', book.title)
            cy.get('.books-wrapper .rt-tbody > :nth-child('+(index+1)+')').should('contain', book.author)
          })
        })
    })
  })

  context('STUBBING', () => {
    it('1. NO STUB - read books from api', () => {
      // test case added for comparing the real API response to stubbed rsponses in test cases 2 + 3
      cy.request({
        method: 'GET',
        url:     apiUrl+'/BookStore/v1/Books'
      })
        .then(response => {
          // expect(response).to.have.property('status', 200)
          expect(response.body).to.not.be.null
          expect(response.body.books.length).to.eq(8)
          expect(response.body.books[0].title).to.eql(bookTitle)
          expect(response.body.books[0].author).to.eql(bookAuthor)
          // cy.writeFile('cypress/fixtures/responseDemomodel.json', response.body)
        })
    })

    it('2. STUB - read books from stub', () => {
      bookTitle = 'Demo Book 1'
      bookAuthor = 'Edwin Peters'
      cy.fixture('books4.json').as('stubResponse')  // books4.json has 4 books
      // cy.fixture('books8.json').as('stubResponse')  // books8.json has 8 books

      cy.server().route({ // server + route are removed from Cypress' next major version; replaced by intercept
        method:   'GET',
        url:      apiUrl+'/BookStore/v1/Books',
        response: '@stubResponse'
      }) 
        .its('response')
        .as('stub')
        .then(stub => {
          expect(stub).to.not.be.null
          expect(stub.books.length).to.eq(4)              // books4.json has 4 books
          // expect(stub.books.length).to.be.eql(8)          // books8.json has 8 books
          expect(stub.books[0].title).to.eql(bookTitle) // title has an additional 2 to the title in the stub file
          expect(stub.books[0].author).to.eql(bookAuthor)
        })
    })
    
    it('3. STUB - NEW: intercept - read books from stub', () => {
      // new in Cypress 6.0: cy.intercept()
      // NOT a 1-on-1 replacement for cy.server().route()
      cy.intercept({
        method: 'GET',
        url: apiUrl+'/BookStore/v1/Books'
      },
        (req) => {
          req.reply({fixture: 'books4.json'})   // response is replaced by fixture file
      })
        .as('getBooks')

      cy.visit('/')  
      cy.wait('@getBooks')
        .its('response')
        .as('response')
        .then(response => {
          expect(response.statusCode).to.eq(200)
          expect(response.body).to.not.be.null
          expect(response.body.books.length).to.eq(4)   // number of books from stub
      })
    })

  })
  
})