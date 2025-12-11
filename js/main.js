
let app = new Vue({
  el:'#app',
  data(){
    return{
      lessons:[],
      displayedLessons:[],
      cart:[],
      customerName:'',
      customerPhone:'',
      orderMessage:'',
      searchQuery:'',
      searching:false,
      searchTimer:null,
      showCart:false,
      sortAttribute:'subject',
      sortOrder:'asc'
    };
  },
  created(){ this.displayedLessons = this.lessons.slice(); },
  computed:{
    total(){ return this.cart.reduce((sum,it)=>sum + (it.qty*it.price),0); },
    nameValid(){ return /^[A-Za-z\s]+$/.test(this.customerName.trim()); },
    phoneValid(){ return /^\d+$/.test(this.customerPhone.trim()); },
    canCheckout(){
       return this.cart.length>0 && this.nameValid && this.phoneValid; 
      },
    cartCount(){ return this.cart.reduce((sum,it)=>sum+it.qty,0); },
    sortedLessons(){
      let arr = this.displayedLessons.slice();
      let attr = this.sortAttribute;
      arr.sort((a,b)=>{
        let valA = a[attr], valB = b[attr];
        if(typeof valA==='string') valA=valA.toLowerCase();
        if(typeof valB==='string') valB=valB.toLowerCase();
        if(valA<valB) return this.sortOrder==='asc'?-1:1;
        if(valA>valB) return this.sortOrder==='asc'?1:-1;
        return 0;
      });
      return arr;
    }
  },
  methods:{
    toggleCart(){ this.showCart=!this.showCart; },
    addToCart(lesson){
      if(lesson.spaces<=0)return;
      let existing=this.cart.find(i=>i.id===lesson.id);
      if(existing) existing.qty+=1;
      else this.cart.push({id:lesson.id,title:lesson.title,price:lesson.price,qty:1});
      lesson.spaces-=1;
    },
    removeFromCart(item){
      let index=this.cart.findIndex(i=>i.id===item.id);
      if(index!==-1)this.cart.splice(index,1);
      // restore spaces
      let lesson=this.lessons.find(l=>l.id===item.id);
      if(lesson) lesson.spaces+=item.qty;
    },
    updateQty(item){ if(item.qty<1)item.qty=1; },
    async checkout() {
  if (this.canCheckout) { // Removed the '!' negation
    try {
      let response = await fetch('http://localhost:3010/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: this.customerName.trim(),
          customerPhone: this.customerPhone.trim(),
          cart: this.cart.map(i => ({ topic: i.title, quantity: i.qty }))
        })
      });

      let result = await response.json();
      
      if (response.ok) {
        this.orderMessage = `Order submitted for ${this.customerName.trim()}. Total: $${this.total}. Thank you!`;
        // Reset cart and form
        this.cart = [];
        this.customerName = '';
        this.customerPhone = '';
        this.showCart = false; // Optional: close cart view
        } else {
          this.orderMessage = result.error || 'Failed to place order. Please try again.';
        }
      } catch (error) {
        console.error('Checkout error:', error);
        this.orderMessage = 'Network error. Please check your connection and try again.';
      }
      } else {
        this.orderMessage = 'Please fill in all required fields and add items to your cart.';
      }
  
      let vm = this;
      setTimeout(() => { vm.orderMessage = ''; }, 7000);
    },
    onSearchInput(){
      let vm=this;
      vm.searching=true;
      if(vm.searchTimer) clearTimeout(vm.searchTimer);
      vm.searchTimer=setTimeout(()=>{ vm.clientFilter(vm.searchQuery.trim()); },300);
    },
    clientFilter(q){
      let vm=this;
      if(!q){ vm.displayedLessons=vm.lessons.slice(); vm.searching=false; return; }
      let low=q.toLowerCase();
      vm.displayedLessons=vm.lessons.filter(l=>
        (l.title && l.title.toLowerCase().includes(low))
        || (l.subject && l.subject.toLowerCase().includes(low))
        || (l.location && l.location.toLowerCase().includes(low))
        || String(l.price).includes(low)
        || String(l.spaces).includes(low)
      );
      vm.searching=false;
    }
  },
  beforeMount(){
    fetch('http://localhost:3010/lessons').then(res=>res.json()).then(data=>{
      this.lessons=[...data];
      this.displayedLessons=[...data];
    });
  },
});
