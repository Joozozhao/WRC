Component({
   options: {
      multipleSlots: true // 在组件定义时的选项中启用多slot支持
   },
   // externalClasses: ['my-class'],
   properties: {
      totalChallenge: {
         type: Number,
         value: ''
      },
      totalActy: {
         type: Number,
         value: ''
      },
      activityList: {
         type: Array,
         value: ''
      },
      activityList2: {
         type: Array,
         value: ''
      },
   },
   data: {
      
   },
   methods: {
      onTapChild(){
         this.triggerEvent('parentEvent')
      },
      onTapChild2(){
         this.triggerEvent('parentEvent2')
      },
      getInfor(e){
         var id = e.currentTarget.dataset.id
         var type = e.currentTarget.dataset.type
         this.triggerEvent('parentEvent3',{id:id,type:type})
      },
   }
})