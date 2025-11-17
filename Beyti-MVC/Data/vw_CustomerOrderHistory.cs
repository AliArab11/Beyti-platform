using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Beyti_MVC.Data;

[Keyless]
public partial class vw_CustomerOrderHistory
{
    public int OrderId { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = null!;

    [StringLength(20)]
    public string PaymentStatus { get; set; } = null!;

    [StringLength(20)]
    public string FulfillmentType { get; set; } = null!;

    [Column(TypeName = "decimal(11, 2)")]
    public decimal? TotalAmount { get; set; }

    public int CustomerId { get; set; }

    [StringLength(100)]
    public string? CustomerName { get; set; }

    public int SellerId { get; set; }

    [StringLength(120)]
    public string StoreName { get; set; } = null!;

    [StringLength(200)]
    public string? DeliveryStreet { get; set; }

    [StringLength(100)]
    public string? DeliveryCity { get; set; }

    [StringLength(200)]
    public string? PickupStreet { get; set; }

    [StringLength(100)]
    public string? PickupCity { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }
}
