using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Index("CustomerId", Name = "IX_Orders_Customer")]
[Index("DeliveryAddressId", Name = "IX_Orders_DeliveryAddress")]
[Index("SellerId", Name = "IX_Orders_Seller")]
public partial class Order
{
    [Key]
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public int SellerId { get; set; }

    public int? DeliveryAddressId { get; set; }

    public int? PickupAddressId { get; set; }

    [StringLength(20)]
    public string PaymentMethod { get; set; } = null!;

    [StringLength(20)]
    public string PaymentStatus { get; set; } = null!;

    [StringLength(20)]
    public string FulfillmentType { get; set; } = null!;

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal SubtotalAmount { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal DeliveryFee { get; set; }

    [Column(TypeName = "decimal(11, 2)")]
    public decimal? TotalAmount { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("CustomerId")]
    [InverseProperty("Orders")]
    public virtual Customer Customer { get; set; } = null!;

    [ForeignKey("DeliveryAddressId")]
    [InverseProperty("OrderDeliveryAddresses")]
    public virtual Address? DeliveryAddress { get; set; }

    [InverseProperty("Order")]
    public virtual DeliveryTicket? DeliveryTicket { get; set; }

    [InverseProperty("Order")]
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    [InverseProperty("Order")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    [ForeignKey("PickupAddressId")]
    [InverseProperty("OrderPickupAddresses")]
    public virtual Address? PickupAddress { get; set; }

    [InverseProperty("Order")]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [ForeignKey("SellerId")]
    [InverseProperty("Orders")]
    public virtual Seller Seller { get; set; } = null!;
}
